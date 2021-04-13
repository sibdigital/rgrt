import {
	Box,
	Button, Chip,
	Field, Icon,
	Margins,
	SelectFiltered,
	Table,
	Tabs,
	TextAreaInput,
	TextInput,
} from '@rocket.chat/fuselage';
import React, { useMemo, useCallback, useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import ReactTooltip from 'react-tooltip';

import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { constructPersonFullFIO } from '../../../../utils/client/methods/constructPersonFIO';
import { ErrandStatuses } from '../../utils/ErrandStatuses';
import { settings } from '../../../../settings/client';
import { useFormatDate } from '../../../../../client/hooks/useFormatDate';
import AnswerForm, { AnswerTypes } from '../../../../working-group-requests/client/views/AnswerForm';
import { ProtocolField as ProtocolChoose, ProtocolItemsField, MailField } from '../../../../working-group-requests/client/views/RequestForm';
import { GenericTable, Th } from '../../../../../client/components/GenericTable';
import { ErrandTypes } from '../../utils/ErrandTypes';
import { deCapitalize } from '../../../../../client/helpers/capitalize';
import { filesValidation } from '../../../../ui/client/lib/fileUpload';
import { useToastMessageDispatch } from '../../../../../client/contexts/ToastMessagesContext';
import { mime } from '../../../../utils';
import { getErrandFieldsForSave } from './ErrandForm';

function DefaultField({ title, renderInput,flexDirection = 'row', required = false, ...props }) {
	return <Field display='flex' flexDirection={flexDirection} mie={flexDirection === 'row' && 'x16'} {...props}>
		<Field.Label
			style={{ flex: '0 0 0px', whiteSpace: 'pre' }}
			alignSelf={flexDirection === 'row' && 'center'}
			mbe={flexDirection === 'column' && 'x16'}
			mie='x16'
			width='max-content'
		>
			{title}
			{required && <span style={{ color: 'red' }}>*</span>}
		</Field.Label>
		{renderInput}
	</Field>;
}

function InitiatedByField({ initiatedBy, ...props }) {
	const t = useTranslation();
	const renderInput = useMemo(() => <TextInput flexGrow={1} placeholder={t('Errand_Initiated_by')} value={constructPersonFullFIO(initiatedBy ?? '')}/>, [t, initiatedBy]);

	return useMemo(() => <DefaultField title={t('Errand_Initiated_by')} renderInput={renderInput} {...props}/>, [props, renderInput, t]);
}

function ChargedToField({ chargedTo, ...props }) {
	const t = useTranslation();
	const renderInput = useMemo(() => <TextInput flexGrow={1} placeholder={t('Errand_Charged_to')} value={constructPersonFullFIO(chargedTo?.person ?? '')}/>, [t, chargedTo]);

	return useMemo(() => <DefaultField title={t('Errand_Charged_to')} renderInput={renderInput} {...props}/>, [props, renderInput, t]);
}

function CreatedAtField({ ts, ...props }) {
	const t = useTranslation();
	const formatDate = useFormatDate();
	const renderInput = useMemo(() => <TextInput flexGrow={1} value={formatDate(ts ? new Date(ts) : new Date())}/>, [ts]);

	return useMemo(() => <DefaultField title={t('Errand_Created_At')} renderInput={renderInput} {...props}/>, [props, renderInput, t]);
}

function ExpireAtField({ expireAt, handleExpireAt, inputStyles, ...props }) {
	const t = useTranslation();
	const formatDate = useFormatDate();
	// const renderInput = useMemo(() => <TextInput flexGrow={1} value={formatDate(expireAt ? new Date(expireAt) : new Date())}/>, [expireAt, formatDate]);
	const renderInput = useMemo(() =>
		<DatePicker
			mie='x16'
			dateFormat='dd.MM.yyyy'
			selected={expireAt.value ?? ''}
			onChange={(newDate) => handleExpireAt({ value: newDate, required: expireAt.required })}
			customInput={<TextInput style={inputStyles}/>}
			locale='ru'
			popperClassName='date-picker'/>
	, [expireAt, handleExpireAt, inputStyles]);

	return useMemo(() => <DefaultField title={t('Errand_Expired_date')} required={true} renderInput={renderInput} {...props}/>, [props, renderInput, t]);
}

function ErrandStatusField({ inputStyles, status, handleStatus, ...props }) {
	const t = useTranslation();
	const statusValue = useMemo(() => (status?.key && ErrandStatuses[status.key] ? ErrandStatuses[status.key].key : ''), [status]);

	const availableStatuses = useMemo(() => {
		const options = [];
		for (const [key, value] of Object.entries(ErrandStatuses)) {
			if (typeof value === 'object') {
				options.push([key, t(value.i18nLabel)]);
			}
		}
		return options;
	}, [t]);

	const handleChange = useCallback((value) => {
		try {
			const _status = ErrandStatuses[value];
			handleStatus({ ..._status, i18nLabel: _status.title === _status.i18nLabel ? t(_status.title) : _status.i18nLabel });
		} catch (e) {
			console.error(e);
		}
	}, [handleStatus, t]);

	useMemo(() => console.dir({ statusValue }), [statusValue]);

	const renderInput = useMemo(() =>
		<SelectFiltered style={inputStyles} options={availableStatuses} value={statusValue} key='status' onChange={handleChange} placeholder={t('Status')}/>
	, [availableStatuses, handleChange, inputStyles, statusValue, t]);

	return useMemo(() => <DefaultField title={t('Status')} required={true} renderInput={renderInput} {...props}/>, [props, renderInput, t]);
}

function DescriptionField({ desc, ...props }) {
	const t = useTranslation();
	const renderInput = useMemo(() => <TextAreaInput style={{ wordBreak: 'break-word', whiteSpace: 'break-spaces' }} placeholder={t('Description')} rows='5' flexGrow={1} value={desc ?? ''}/>, [desc, t]);

	return useMemo(() => <DefaultField title={t('Description')} renderInput={renderInput} flexDirection={'column'} {...props}/>, [props, renderInput, t]);
}

function CommentaryField({ commentary, required, inputStyles, handleCommentary, ...props }) {
	const t = useTranslation();
	const renderInput = useMemo(() => <TextAreaInput style={inputStyles} rows='3' placeholder={t('Commentary')} flexGrow={1} value={commentary ?? ''} onChange={(e) => handleCommentary(e.currentTarget.value)}/>, [commentary, handleCommentary, t]);

	return useMemo(() => <DefaultField title={t('Commentary')} required={required} renderInput={renderInput} flexDirection={'column'} {...props}/>, [props, renderInput, t]);
}

function ProtocolField({ protocol, ...props }) {
	const t = useTranslation();
	const formatDate = useFormatDate();

	const protocolUrl = useMemo(() => (protocol && protocol._id ? [settings.get('Site_Url'), 'protocol/', protocol._id].join('') : ''), [protocol]);
	const protocolItemUrl = useMemo(() => (protocol && protocol.sectionId && protocol.itemId ? [settings.get('Site_Url'), 'protocol/', protocol._id, '/', 'edit-item/', protocol.sectionId, '/', protocol.itemId].join('') : protocolUrl), [protocol, protocolUrl]);
	const protocolLabel = useMemo(() => (protocol ? [t('Protocol'), ' от ', formatDate(protocol.d), ' № ', protocol.num].join('') : ''), [formatDate, protocol, t]);
	const protocolItemLabel = useMemo(() => (protocol && protocol.sectionId && protocol.itemId
		? ['№', protocol.itemNum, ', ', protocol.itemName ?? ''].join('')
		: protocolUrl)
	, [protocol, protocolUrl, t]);

	return useMemo(() => (protocol && protocol._id
		? <Field display='flex' flexDirection='row' {...props}>
			<Field display='flex' flexDirection='row'>
				<Field.Label style={{ flex: '0 0 0px', whiteSpace: 'pre' }} alignSelf='center' mie='x16'>{t('Protocol')}</Field.Label>
				<Field borderColor='#cbced1' borderWidth='x2' paddingBlock='x8' paddingInline='x14' minHeight='x40' mie='x16' mis='x8'>
					<a style={{ maxWidth: 'max-content' }} href={protocolUrl}>{protocolLabel}</a>
				</Field>
			</Field>
			<Field display='flex' flexDirection='row' mie='x16'>
				<Field.Label style={{ flex: '0 0 0px', whiteSpace: 'pre' }} alignSelf='center' mie='x16'>{t('Protocol_Item')}</Field.Label>
				<Field borderColor='#cbced1' borderWidth='x2' paddingBlock='x8' paddingInline='x14' minHeight='x40' mis='x8'>
					<a href={protocolItemUrl}>{protocolItemLabel}</a>
				</Field>
			</Field>
		</Field>
		: <></>)
	, [protocol, props, t, protocolUrl, protocolLabel, protocolItemUrl, protocolItemLabel]);
}

export function DefaultErrandFields({ inputStyles, values, handlers }) {
	const {
		status,
		ts,
		initiatedBy,
		chargedTo,
		desc,
		expireAt,
		commentary,
	} = values;

	const {
		handleStatus,
		handleExpireAt,
		handleCommentary,
	} = handlers;

	const onChangeField = useCallback((val, field, handler) => {
		handler({ ...field, value: val });
	}, []);

	return <Box display='flex' flexDirection='column'>
		<Margins inline='x8' block='x16'>

			<Box display='flex' flexDirection='row'>
				<InitiatedByField initiatedBy={initiatedBy.value}/>
				<CreatedAtField ts={ts.value} />
			</Box>
			<DescriptionField desc={desc.value}/>
			<Box display='flex' flexDirection='row'>
				<ChargedToField chargedTo={chargedTo.value}/>
				<ExpireAtField expireAt={expireAt} handleExpireAt={handleExpireAt} inputStyles={inputStyles}/>
				<ErrandStatusField inputStyles={inputStyles} handleStatus={(val) => onChangeField(val, status, handleStatus)} status={status.value}/>
			</Box>
			<CommentaryField inputStyles={inputStyles} commentary={commentary.value} required={commentary.required} handleCommentary={(val) => onChangeField(val, commentary, handleCommentary)}/>

		</Margins>
	</Box>;
}

export function ErrandByProtocolItemFields({ inputStyles, values, handlers }) {
	const {
		status,
		ts,
		initiatedBy,
		chargedTo,
		desc,
		expireAt,
		commentary,
		protocol,
	} = values;

	const {
		handleStatus,
		handleCommentary,
		handleExpireAt,
	} = handlers;

	const onChangeField = useCallback((val, field, handler) => {
		handler({ ...field, value: val });
	}, []);

	return <Box display='flex' flexDirection='column'>
		<Margins inline='x8' block='x16'>

			<Box display='flex' flexDirection='row'>
				<InitiatedByField initiatedBy={initiatedBy.value}/>
				<CreatedAtField ts={ts.value} />
			</Box>
			<ProtocolField protocol={protocol.value}/>
			<DescriptionField desc={desc.value}/>
			<Box display='flex' flexDirection='row'>
				<ChargedToField chargedTo={chargedTo.value}/>
				<ExpireAtField expireAt={expireAt} handleExpireAt={handleExpireAt} inputStyles={inputStyles}/>
				<ErrandStatusField inputStyles={inputStyles} handleStatus={(val) => onChangeField(val, status, handleStatus)} status={status.value}/>
			</Box>
			<CommentaryField inputStyles={inputStyles} commentary={commentary.value} required={commentary.required} handleCommentary={(val) => onChangeField(val, commentary, handleCommentary)}/>

		</Margins>
	</Box>;
}

export function ErrandByRequestFields({ inputStyles, values, handlers, request, setContext, items, setItems }) {
	const t = useTranslation();

	const [tab, setTab] = useState('errand');

	const {
		initiatedBy,
		chargedTo,
		desc,
		protocol,
		documents,
		answerType,
		mail,
	} = values;

	const {
		handleDesc,
		handleChargedTo,
		handleInitiatedBy,
		handleProtocol,
		handleDocuments,
		handleMail,
		handleAnswerType,
	} = handlers;

	useEffect(() => {
		console.dir({ request });
		if (request && request._id && request.itemResponsible && request.itemResponsible._id && !chargedTo?._id) {
			handleChargedTo({ ...chargedTo, value: { person: request.itemResponsible } });
		}

		if (request && request._id && request.desc && desc.value === '') {
			handleDesc({ ...desc, value: request.desc });
		}
	},[request]);

	useMemo(() => {
		if (!answerType?.value?.state) {
			handleAnswerType({ ...answerType, value: AnswerTypes.PROTOCOL });
		}
	}, [answerType]);

	const chooseButtonStyles = useMemo(() => ({ backgroundColor: 'transparent', borderColor: 'var(--rc-color-primary-button-color)', borderRadius: '0.7rem', borderWidth: '1.5px' }), []);

	const answerValues = useMemo(() => getErrandFieldsForSave({ errand: values, errandType: ErrandTypes.byRequestAnswer }), [values]);

	const getKeyByHandler = (handleName) => {
		console.dir({ handleName });
		if (handleName.includes('handle')) {
			return deCapitalize(handleName.slice(6));
		}
		return handleName;
	};

	const onChangeField = useCallback((handler, value) => {
		const key = getKeyByHandler(handler);
		console.dir({ handled: handlers[handler], key, val: values[key], valuesInChange: values });
		if (handlers[handler]) {
			handlers[handler]({ value, required: values[key].required ?? false });
		}
	}, [handlers, values]);
	console.dir({ valuesInErrandFields: values });

	return <Box display='flex' flexDirection='column' mbe='x16'>

		<Box display='flex' flexDirection='row' mbe='x16'>
			<Tabs flexShrink={0}>
				<Tabs.Item selected={tab === 'errand'} onClick={() => setTab('errand')}>{t('Errand')}</Tabs.Item>
				<Tabs.Item selected={tab === 'answer'} onClick={() => setTab('answer')}>{t('Info')}</Tabs.Item>
				<Tabs.Item selected={tab === 'files'} onClick={() => setTab('files')}>{t('Files')}</Tabs.Item>
			</Tabs>
		</Box>
		{ tab === 'errand'
			&& <DefaultErrandFields inputStyles={inputStyles} handlers={handlers} values={values}/>
		}
		{ tab === 'answer'
			&& <><AnswerForm defaultValues={answerValues} defaultHandlers={handlers} onAnswerErrand={true} onErrandHandle={onChangeField}/>
				<Margins all='x8'>
					{
						answerType.value.key === AnswerTypes.PROTOCOL.key
						&& <><ProtocolChoose flexDirection={'row'} protocol={protocol.value} handleProtocol={handleProtocol} inputStyles={inputStyles} handleChoose={setContext} chooseButtonStyles={chooseButtonStyles}/>
							<ProtocolItemsField handleProtocolItems={setItems} protocolItems={items} protocolId={protocol?.value?._id ?? null} chooseButtonStyles={chooseButtonStyles} handleChoose={setContext}/></>
					}
					{
						answerType.value.key === AnswerTypes.MAIL.key
						&& <MailField inputStyles={inputStyles} requestType={answerType.value} mail={mail.value} handleMail={(val) => handleMail({ ...mail, value: val.currentTarget.value })}/>
					}

				</Margins>
			</>
		}
		{ tab === 'files'
			&& <AnswerFilesTable files={documents?.value ?? []} documents={documents} handleDocuments={handleDocuments}/>
		}
	</Box>;
}

function AnswerFilesTable({ files, documents, handleDocuments }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [context, setContext] = useState('');
	const [currentUploadedFiles, setCurrentUploadedFiles] = useState([]);
	const [staticFileIndex, setStaticFileIndex] = useState(0);
	const [maxOrderFileIndex, setMaxOrderFileIndex] = useState(0);

	const handleFileUploadChipClick = (index) => () => {
		setCurrentUploadedFiles(currentUploadedFiles.filter((file, _index) => _index !== index));
	};

	const fileUpload = useCallback(async () => {
		let validationArray = [];
		if (currentUploadedFiles.length > 0) {
			validationArray = await filesValidation(currentUploadedFiles);
			if (validationArray.length > 0) {
				const attachedFilesBuf = currentUploadedFiles;
				validationArray.map((errFile) => attachedFilesBuf.map((file) => {
					if (errFile.id === file.id || errFile._id === file._id) {
						file.fail = true;
						file.error = errFile.error;
					}
					return file;
				}));
				dispatchToastMessage({ type: 'error', message: t('Working_group_request_invite_file_upload_failed') });
				setCurrentUploadedFiles(attachedFilesBuf);
			} else {
				// await fileUploadToErrand(currentUploadedFiles, { _id: errandId });
				setContext('');
				handleDocuments({ value: [...documents.value, ...currentUploadedFiles], required: documents.required });
				setCurrentUploadedFiles([]);
				setMaxOrderFileIndex(maxOrderFileIndex + staticFileIndex);
				dispatchToastMessage({ type: 'success', message: t('File_uploaded') });
			}
		}
	}, [currentUploadedFiles, dispatchToastMessage, t]);

	const onDownloadClick = (file) => async (e) => {
		e.preventDefault();
		try {
			const filename = `${ file.name }`;
			if (window.navigator && window.navigator.msSaveOrOpenBlob) {
				const blob = new Blob([decodeURIComponent(encodeURI(JSON.stringify(file)))], { type: file.type });
				return navigator.msSaveOrOpenBlob(blob, filename);
			}
			const aElement = document.createElement('a');
			aElement.download = filename;
			aElement.href = `${ file.title_link }`;
			aElement.target = '_blank';
			document.body.appendChild(aElement);
			aElement.click();
			document.body.removeChild(aElement);
		} catch (e) {
			console.error('[index.js].downloadWorkingGroupRequestAnswerFile: ', e);
		}
	};

	const fileUploadClick = async () => {
		if (!settings.get('FileUpload_Enabled')) {
			console.log('!fileupload_enabled');
			return null;
		}
		setContext('uploadFiles');
		let fileIndex = staticFileIndex;
		const $input = $(document.createElement('input'));
		$input.css('display', 'none');
		$input.attr({
			id: 'fileupload-input',
			type: 'file',
			multiple: 'multiple',
		});

		$(document.body).append($input);

		$input.one('change', function(e) {
			const filesToUpload = [...e.target.files].map((file, orderIndex) => {
				Object.defineProperty(file, 'type', {
					value: mime.lookup(file.name),
				});
				fileIndex++;
				return {
					file,
					orderIndex: orderIndex + maxOrderFileIndex,
					name: file.name,
					title: file.name,
					id: fileIndex,
					ts: new Date(),
				};
			});
			setStaticFileIndex(fileIndex);
			setCurrentUploadedFiles(currentUploadedFiles ? currentUploadedFiles.concat(filesToUpload) : filesToUpload);
			setContext('uploadFiles');

			$input.remove();
		});
		$input.click();

		if (navigator.userAgent.match(/(iPad|iPhone|iPod)/g)) {
			$input.click();
		}
	};

	const header = useMemo(() => [
		<Th key={'File_name'} color='default'>
			{ t('File_name') }
		</Th>,
		<Th w='x40' key='download'/>,
	], [t]);

	const renderRow = (document) => {
		const { name } = document;
		return <Table.Row tabIndex={0} role='link' action>
			<Table.Cell fontScale='p1' color='default'>{name}</Table.Cell>
			<Table.Cell alignItems={'end'}>
				<Button onClick={onDownloadClick(document)} small aria-label={t('download')}>
					<Icon name='download'/>
				</Button>
			</Table.Cell>
		</Table.Row>;
	};

	// console.dir({ filesInErrandFields: files, documents });
	return <Box display='flex' flexDirection='column'>
		<Button mis='x16' mbe='x16' small primary width='max-content' onClick={fileUploadClick}>{t('Upload_file')}</Button>
		{context === 'uploadFiles' && currentUploadedFiles?.length > 0
		&& <Box display='flex' flexDirection='row' flexWrap='wrap' justifyContent='flex-start' mbs='x4'>
			<Margins inlineEnd='x4' blockEnd='x4'>
				{currentUploadedFiles.map((file, index) =>
					<Chip pi='x4' key={index} onClick={handleFileUploadChipClick(index)} border={file.fail ? '2px solid red' : ''} data-for='fileErrorTooltip' data-tip={ file.error ?? '' } style={{ whiteSpace: 'normal' }}>
						{file.name ?? ''}
						<ReactTooltip id='fileErrorTooltip' effect='solid' place='top'/>
					</Chip>)}
			</Margins>
		</Box>
		}
		{context === 'uploadFiles' && currentUploadedFiles?.length > 0
		&& <Field mbe='x8'>
			<Field.Row>
				<Button onClick={fileUpload} mie='10px' small primary aria-label={t('Save')}>
					{t('Save')}
				</Button>
				<Field.Label alignSelf='center'>{t('Number_of_files')} {currentUploadedFiles?.length ?? 0}</Field.Label>
			</Field.Row>
		</Field>
		}
		<GenericTable header={header} renderRow={renderRow} results={files ?? []} total={files?.length || 0}/>
	</Box>;
}
