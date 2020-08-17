import { Box, Button, ButtonGroup, Field, Margins, TextInput } from '@rocket.chat/fuselage';
import React, { useMemo, useState } from 'react';
import CKEditor from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import '@ckeditor/ckeditor5-build-classic/build/translations/ru';

import { useMethod } from '../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';


function packData(data) {
	const dataToSend = {};
	Object.keys(data).forEach((key) => {
		dataToSend[key] = data[key].value.trim();
	});
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

	const handleSubmit = async () => {
		setComitting(true);
		try {
			const dataToSend = packData(newData);
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
