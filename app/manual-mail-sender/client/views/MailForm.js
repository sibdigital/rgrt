import { Box, Button, ButtonGroup, Chip, Field, InputBox, Margins, TextInput, Icon } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import React, { Component, useMemo, useState, useEffect } from 'react';
import ReactTooltip from 'react-tooltip';
import CKEditor from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import '@ckeditor/ckeditor5-build-classic/build/translations/ru';
import DropdownTreeSelect from 'react-dropdown-tree-select';
import isEqual from 'lodash.isequal';
import 'react-dropdown-tree-select/dist/styles.css';
import '../../public/stylesheets/mail-sender.css';

import { useMethod } from '../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { isEmail } from '../../../utils';

import '../../../working-group-requests/client/views/formForSendingDocuments/steps/reactTooltip.css';

function packData(data, files) {
	const dataToSend = {};
	Object.keys(data).forEach((key) => {
		dataToSend[key] = data[key].value.trim();
	});
	dataToSend.files = files;
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
			<DropdownTreeSelect data={this.state.data} dropdownClassName='date-picker' {...rest} />
		);
	}
}

function MailForm({ recipients, mailSubject, mailBody, defaultEmails, emailsArray }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const fileSourceInputId = useUniqueId();

	const [newData, setNewData] = useState({
		email: { value: '', required: true },
		topic: { value: '', required: true },
		message: { value: '<p>Здравствуйте, </p>', required: true },
	});
	const [chipEmails, setChipEmails] = useState([]);
	const [handChipEmails, setHandChipEmails] = useState([]);
	const [chipEmail, setChipEmail] = useState('');
	const [email, setEmail] = useState('');
	const [topic, setTopic] = useState('');
	const [message, setMessage] = useState('');
	const [commiting, setComitting] = useState(false);
	const [files, setFiles] = useState([]);
	const [cache, setCache] = useState('');

	const mailBodyContext = mailBody;
	const mailSubjectContext = mailSubject;
	const defaultEmailsContext = defaultEmails;

	const sendEmail = useMethod('sendEmailManually');

	const isValidInputEmail = useMemo(() => isEmail(chipEmail), [chipEmail]);

	const allFieldAreFilled = useMemo(() => topic.trim() !== '' && message.trim() !== '' && (email.trim() !== '' || handChipEmails.length > 0 || isValidInputEmail), [email, topic, message, handChipEmails, isValidInputEmail]);

	useEffect(() => {
		if (mailBodyContext !== undefined && mailBodyContext.length > 0 && mailSubjectContext !== undefined && mailSubjectContext.length > 0) {
			console.log('rerender');
			setChipEmails(emailsArray);
			setEmail(defaultEmailsContext ?? '');
			setTopic(mailSubjectContext);
			setMessage(mailBodyContext);
		}
	}, [mailSubjectContext, mailBodyContext, defaultEmailsContext]);

	const onChange = () => {
		setCache(new Date());
	};

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

	const handleEmailChipChange = (email) => {
		setChipEmail(email);
	};

	const handleEmailChipClick = (email) => () => {
		const emailToAdd = { value: email, hand: true };
		setHandChipEmails(handChipEmails ? handChipEmails.concat(emailToAdd) : [emailToAdd]);
		setChipEmail('');
	};

	const handleEmailsChipClick = (index) => () => {
		setHandChipEmails(handChipEmails.filter((chip, _index) => _index !== index));
		onChange();
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
		setTopic(getValue(e));
	};

	const handleDropdownTreeSelectChange = (currentNode, selectedNodes) => {
		let emailsStr = '';
		const emailsArray = [];
		selectedNodes.forEach((item) => {
			const getEmails = (obj, path) => {
				const emails = [];
				obj.forEach((node) => {
					if (!node.children && node.path.startsWith(path)) {
						emailsStr += [node.value, ','].join('');
						emailsArray.push({ value: [node.value, ','].join(''), index: node.index, tooltip: node.label });
					}
					if (node.children) {
						getEmails(node.children, path);
					}
				});
				return emails;
			};
			getEmails(recipients, item.path);
		});
		setChipEmails(emailsArray);
		setEmail(emailsStr);
		onChange();
	};

	console.log(allFieldAreFilled);
	return <Field style={{ overflowY: 'scroll' }}>
		<Field mbe='x8'>
			<Field.Label>{t('Email_receivers')} <span style={ { color: 'red' } }>*</span></Field.Label>
			<Field>
				<DropdownTreeSelectContainer
					className='custom-tree-select'
					data={recipients}
					onChange={handleDropdownTreeSelectChange}
					texts={
						{
							placeholder: 'Поиск...',
							noMatches: 'Не найдено совпадений',
						}
					}
				/>
				<Box display='flex' flexDirection='row' flexWrap='wrap' justifyContent='flex-start' mbs='x4' backgroundColor={'var(--tertiary-background-color)'}>
					<Margins inlineStart='x4' inlineEnd='x4' blockStart='x4' blockEnd='x4'>
						{ chipEmails.map((chip, index) =>
							<Chip pi='x4' key={index} style={{ whiteSpace: 'normal', borderRadius: '0.6rem' }} border='1px solid' color='var(--rc-color-button-primary)'
								data-for='chipEmailTooltip' data-tip={ chip.tooltip ?? '' } className='.react-tooltip-class'>
								{chip.value ?? ''}
								<ReactTooltip id='chipEmailTooltip' className='react-tooltip-class' effect='solid' place='top'/>
							</Chip>)}
						{ handChipEmails.map((chip, index) =>
							<Chip pi='x4' key={index} style={{ whiteSpace: 'normal', borderRadius: '0.6rem' }}
								onClick={handleEmailsChipClick(index)} border='1px solid' color='var(--rc-color-button-primary-light)'>
								{chip.value ?? ''}
							</Chip>)}
						<Field
							maxHeight='30px' maxWidth='250px' display='flex' flexDirection='row' flexWrap='wrap' justifyContent='flex-start'
							border='0px hidden transparent' borderRadius='0.6rem' alignItems='center'>
							<TextInput
								maxHeight='25px'
								minHeight='20px'
								value={chipEmail}
								onChange={(e) => handleEmailChipChange(e.currentTarget.value)}
								placeholder={t('Email_input')}
								border='0px hidden transparent'
								borderRadius='0.6rem'/>
							<Button
								backgroundColor='transparent'
								borderColor='transparent'
								disabled={!isValidInputEmail}
								small
								onClick={handleEmailChipClick(chipEmail)}>
								{ isValidInputEmail && <Icon name='plus' size='x16' color={'green'}/>}
								{ !isValidInputEmail && <Icon name='circle-cross' size='x16' color={'red'}/>}
							</Button>
						</Field>
					</Margins>
				</Box>
			</Field>
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
	</Field>;
}

export default MailForm;
