import { Box, Button, ButtonGroup, Chip, Field, InputBox, Margins, Scrollable, TextInput } from '@rocket.chat/fuselage';
import React, { Component, useMemo, useState, useEffect, useCallback } from 'react';
import 'react-dropdown-tree-select/dist/styles.css'
import '../../public/stylesheets/mail-sender.css'
import CKEditor from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import '@ckeditor/ckeditor5-build-classic/build/translations/ru';
import DropdownTreeSelect from 'react-dropdown-tree-select';
import isEqual from 'lodash.isequal';

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

class DropdownTreeSelectContainer extends Component {
	constructor(props) {
		super(props);
		this.state = { data: props.data };
	}

	componentWillReceiveProps = (nextProps) => {
		if (!isEqual(nextProps.data, this.state.data)) {
			this.setState({ data: nextProps.data });
		}
	}

	shouldComponentUpdate = (nextProps) => {
		return !isEqual(nextProps.data, this.state.data);
	}

	render() {
		const { data, ...rest } = this.props;
		return (
			<DropdownTreeSelect data={this.state.data} contentClassName='date-picker' {...rest} />
		);
	}
}

const getEmails = (obj, path) => {
	let emails = '';
	obj.forEach((node) => {
		if (!node.children && node.path.startsWith(path)) {
			emails += node.value + ',';
		}
		if (node.children) {
			emails += getEmails(node.children, path);
		}
	});
	return emails;
};

function MailForm({ recipients, mailSubject, mailBody, defaultEmails }) {
	const [newData, setNewData] = useState({
		email: { value: '', required: true },
		topic: { value: '', required: true },
		message: { value: '<p>Здравствуйте, </p>', required: true },
	});
	const [email, setEmail] = useState('');
	const [topic, setTopic] = useState('');
	const [message, setMessage] = useState('');
	const mailSubjectContext = mailSubject;
	const mailBodyContext = mailBody;
	const defaultEmailsContext = defaultEmails;

	const t = useTranslation();

	const sendEmail = useMethod('sendEmailManually');

	const [commiting, setComitting] = useState(false);

	const dispatchToastMessage = useToastMessageDispatch();

	//const sendFromContext = useMemo(() => mailBodyContext !== undefined && mailBodyContext.length > 0 && mailSubjectContext !== undefined && mailSubjectContext.length > 0, [mailSubjectContext, mailBodyContext]);
	//const allFieldAreFilled = useMemo(() => Object.values(newData).filter((current) => current.value.trim() === '' && current.required === true).length === 0, [JSON.stringify(newData)]);
	const allFieldAreFilled = useMemo(() => email.trim() !== '' && topic.trim() !== '' && message.trim() !== '', [email, topic, message]);

	const fileSourceInputId = useUniqueId();

	const [files, setFiles] = useState([]);

	useEffect(() => {
		if (mailBodyContext !== undefined && mailBodyContext.length > 0 && mailSubjectContext !== undefined && mailSubjectContext.length > 0) {
			console.log('rerender');
			setEmail(defaultEmailsContext ?? '');
			setTopic(mailSubjectContext);
			setMessage(mailBodyContext);
		}
	}, [mailSubjectContext, mailBodyContext, defaultEmailsContext]);

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
					filename: file.name,
				}]));
			};
		});
	};

	const handleFileUploadChipClick = (file) => () => {
		setFiles((files) => files.filter((_file) => _file !== file));
	};

	const handleSubmit = async () => {
		setComitting(true);
		try {
			setNewData({
				email: { value: email, required: true },
				topic: { value: topic, required: true },
				message: { value: message, required: true },
			});
			const dataToSend = packData(newData, files);
			await sendEmail(dataToSend);

			dispatchToastMessage({ type: 'success', message: t('Integrations_Outgoing_Type_SendMessage') });
		} catch (e) {
			const { invalidMails } = e.details;

			dispatchToastMessage({ type: 'error', message: `${ t('Mail_Message_Invalid_emails') }: ${ invalidMails }` });
		} finally {
			setComitting(false);
		}
	};

	$('.main-content').removeClass('rc-old');

	const handleTopicChange = (field, getValue = (e) => e.currentTarget.value) => (e) => {
		//setNewData({ ...newData, [field]: { value: getValue(e), required: newData[field].required } });
		setTopic(getValue(e));
	};

	const handleDropdownTreeSelectChange = (currentNode, selectedNodes) => {
		let emails = '';
		selectedNodes.forEach((item) => {
			emails += getEmails(recipients, item.path);
		});
		//setNewData({ ...newData, email: { value: emails, required: newData.email.required } });
		setEmail(emails);
	};

	return <>
		<Field mbe='x8'>
			<Field.Label>{t('Email_receivers')} <span style={ { color: 'red' } }>*</span></Field.Label>
			<Field.Row>
				<DropdownTreeSelectContainer
					className='tree-select'
					data={recipients}
					onChange={handleDropdownTreeSelectChange}
					texts={
						{
							placeholder: 'Поиск...',
							noMatches: 'Не найдено совпадений',
						}
					}
				/>
			</Field.Row>
		</Field>
		<Field mbe='x8'>
			<Field.Label>{t('Email_subject')} <span style={ { color: 'red' } }>*</span></Field.Label>
			<Field.Row>
				<TextInput value={topic} flexGrow={1} onChange={handleTopicChange('topic')} placeholder={`${ t('Email_subject_placeholder') }`}/>
			</Field.Row>
		</Field>
		<Field mbe='x8'>
			<Field.Label>{t('Email_body')} <span style={ { color: 'red' } }>*</span></Field.Label>
			<Field.Row>
				<CKEditor
					editor={ ClassicEditor }
					config={ {
						language: 'ru',
						removePlugins: ['ImageUpload'],
					} }
					data={ message }
					onChange={ (event, editor) => {
						const data = editor.getData();
						setMessage(data);
						//setNewData({ ...newData, message: { value: data, required: newData.message.required } });
					} }
				/>
			</Field.Row>
		</Field>
		<Field mbe='x8'>
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
		<ButtonGroup align='end'>
			<Button onClick={handleSubmit} primary disabled={!allFieldAreFilled || commiting} >
				{t('Send')}
			</Button>
		</ButtonGroup>
	</>;
}

export default MailForm;
