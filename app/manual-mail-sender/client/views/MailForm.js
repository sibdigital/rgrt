import { Box, Button, ButtonGroup, Field, Margins, TextInput, InputBox, Chip } from '@rocket.chat/fuselage';
import React, { useMemo, useState } from 'react';
import CKEditor from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import '@ckeditor/ckeditor5-build-classic/build/translations/ru';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';

import { useMethod } from '../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';


function packData(data, files) {
	const dataToSend = {};
	Object.keys(data).forEach((key) => {
		dataToSend[key] = data[key].value.trim();
	});
	dataToSend['files'] = files;
	return dataToSend;
}

function MailForm() {
	const [newData, setNewData] = useState({
		email: { value: '', required: true },
		topic: { value: '', required: true },
		message: { value: '', required: true },
	});

	const sendEmail = useMethod('sendEmailManually');

	const handleChange = (field, getValue = (e) => e.currentTarget.value) => (e) => {
		setNewData({ ...newData, [field]: { value: getValue(e), required: newData[field].required } });
	};
	const t = useTranslation();

	const [commiting, setComitting] = useState(false);

	const dispatchToastMessage = useToastMessageDispatch();

	const allFieldAreFilled = useMemo(() => Object.values(newData).filter((current) => current.value.trim() === '' && current.required === true).length === 0, [JSON.stringify(newData)]);

	const fileSourceInputId = useUniqueId();

	const [files, setFiles] = useState([]);

	const handleImportFileChange = async (event) => {
		event = event.originalEvent || event;

		let { files } = event.target;
		if (!files || (files.length === 0)) {
			files = (event.dataTransfer != null ? event.dataTransfer.files : undefined) || [];
		}

		Array.from(files, (file) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onloadend = function(e) {
				setFiles((files) => files.concat([{
					content: reader.result.split(';base64,')[1],
					contentType: file.type,
					filename: file.name
				}]))
			}
		});
	};

	const handleFileUploadChipClick = (file) => () => {
		setFiles((files) => files.filter((_file) => _file !== file));
	};

	const handleSubmit = async () => {
		setComitting(true);
		try {
			const dataToSend = packData(newData, files);
			await sendEmail(dataToSend);

			dispatchToastMessage({ type: 'success', message: t('Integrations_Outgoing_Type_SendMessage') });
		} catch (e) {
			console.error('[MailForm.js].handleSubmit e:', e);

			const { invalidMails } = e.details;

			dispatchToastMessage({ type: 'error', message: `${ t('Mail_Message_Invalid_emails') }: ${ invalidMails }` });
		} finally {
			setComitting(false);
		}
	};

	return <Margins blockEnd='x32'>
		<Box>
			<Box display='flex' flexDirection='column'>
				<Margins all='x8'>
					<Field>
						<Field.Label>{t('Email_receivers')} <span style={ { color: 'red' } }>*</span></Field.Label>
						<Field.Row>
							<TextInput value={newData.email.value} flexGrow={1} onChange={handleChange('email')} placeholder={`${ t('Email_Placeholder_with_comma') }`}/>
						</Field.Row>
					</Field>
					<Field>
						<Field.Label>{t('Email_subject')} <span style={ { color: 'red' } }>*</span></Field.Label>
						<Field.Row>
							<TextInput value={newData.topic.value} flexGrow={1} onChange={handleChange('topic')} placeholder={`${ t('Email_subject_placeholder') }`}/>
						</Field.Row>
					</Field>
					<Field>
						<Field.Label>{t('Email_body')} <span style={ { color: 'red' } }>*</span></Field.Label>
						<Field.Row>
							<CKEditor
								editor={ ClassicEditor }
								config={ {
									language: 'ru',
									removePlugins: ["ImageUpload"],
								} }
								data='<p>Здравствуйте, </p>'
								onChange={ (event, editor) => {
									const data = editor.getData();
									setNewData({ ...newData, message: { value: data, required: newData.message.required } });
								} }
							/>
						</Field.Row>
					</Field>
					<Field>
						<Field.Label alignSelf='stretch' htmlFor={fileSourceInputId}>{t('Add_files')}</Field.Label>
						<Field.Row>
							<InputBox type='file' id={fileSourceInputId} multiple onChange={handleImportFileChange} />
						</Field.Row>
						{files?.length > 0 && <Box display='flex' flexDirection='row' flexWrap='wrap' justifyContent='flex-start' mbs='x4'>
							<Margins inlineEnd='x4' blockEnd='x4'>
								{files.map((file, i) => <Chip pi='x4' key={i} onClick={handleFileUploadChipClick(file)}>{file.filename}</Chip>)}
							</Margins>
						</Box>}
					</Field>
				</Margins>
			</Box>
			<ButtonGroup align='end'>
				<Button onClick={handleSubmit} primary disabled={!allFieldAreFilled || commiting} >
					{t('Send')}
				</Button>
			</ButtonGroup>
		</Box>
	</Margins>;
}

export default MailForm;
