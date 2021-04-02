import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
	Button,
	Field,
	Icon,
	Label,
	Table,
	TextInput,
	TextAreaInput,
	Tabs,
	Select,
	Box,
	Skeleton, Callout,
} from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { FlowRouter } from 'meteor/kadira:flow-router';

import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { GenericTable, Th } from '../../../../client/components/GenericTable';
import { useFormatDateAndTime } from '../../../../client/hooks/useFormatDateAndTime';
import { useRoute, useRouteParameter } from '../../../../client/contexts/RouterContext';
import { ENDPOINT_STATES, useEndpointDataExperimental } from '../../../../client/hooks/useEndpointDataExperimental';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { GoBackButton } from '../../../utils/client/views/GoBackButton';
import { hasPermission } from '../../../authorization';
import { useUserId } from '../../../../client/contexts/UserContext';
import AnswerForm, { useDefaultAnswerForm, getAnswerFormFields } from './AnswerForm';

export const answerStatusState = Object.freeze({
	RECEIVED: { state: 1, title: 'Received' },
	ACCEPTED: { state: 2, title: 'Accepted' },
});

export function AnswerPage() {
	const t = useTranslation();
	const requestId = useRouteParameter('requestid');
	const mailId = useRouteParameter('mailid');
	const answerId = useRouteParameter('answerid');

	const query = useMemo(() => ({
		query: JSON.stringify({ _id: requestId, mailId, answerId }),
	}), [answerId, mailId, requestId]);

	const data = useEndpointData('working-groups-requests.findAnswerOneById', query);

	const filesQuery = useMemo(() => ({ query: JSON.stringify({ _id: data ? { $in: data.documents?.map((doc) => doc._id ?? '') } : {} }) }), [data]);

	const { data: files, state, error } = useEndpointDataExperimental('upload-files.list', filesQuery);

	useMemo(() => console.log(files), [files]);

	if (!hasPermission('manage-working-group-requests', useUserId())) {
		console.log('Permissions_access_missing');
		return <Callout m='x16' type='danger'>{t('Permissions_access_missing')}</Callout>;
	}

	if (state === ENDPOINT_STATES.LOADING) {
		return <Box w='full' pb='x24'>
			<Skeleton mbe='x4'/>
			<Skeleton mbe='x8'/>
			<Skeleton mbe='x4'/>
			<Skeleton mbe='x8'/>
			<Skeleton mbe='x4'/>
			<Skeleton mbe='x8'/>
		</Box>;
	}

	if (state === ENDPOINT_STATES.ERROR) {
		return <Callout m='x16' type='danger'>{t(error.message)}</Callout>;
	}

	return <AnswerWithData answer={data} files={files.files} requestId={requestId} mailId={mailId} answerId={answerId}/>;
}

AnswerPage.displayName = 'AnswerPage';

export default AnswerPage;

function AnswerWithData({ answer, files, requestId, mailId, answerId }) {
	const t = useTranslation();

	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });
	const [tab, setTab] = useState('info');
	const [answerStatusOptions, setAnswerStatusOptions] = useState([]);

	const answerForm = getAnswerFormFields({ answer });

	const { values, handlers } = useDefaultAnswerForm({ defaultValues: answerForm });

	// useEffect(() => {
	// }, [answer]);

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
			aElement.href = `${ file.url }`;
			aElement.target = '_blank';
			document.body.appendChild(aElement);
			aElement.click();
			document.body.removeChild(aElement);
		} catch (e) {
			console.error('[index.js].downloadWorkingGroupRequestAnswerFile: ', e);
		}
	};

	const header = useMemo(() => [
		<Th key={'File_name'} color='default'>
			{ t('File_name') }
		</Th>,
		<Th w='x40' key='download'/>,
	], [mediaQuery]);

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

	useMemo(() => console.dir({ answerStatusState, tar: answerStatusState.ACCEPTED }), []);

	return <Page>
		<Page.Header title=''>
			<Field width={'100%'} display={'block'} marginBlock={'15px'}>
				<GoBackButton/>
				<Label fontScale='h1'>{t('Working_group_received_answer')}</Label>
			</Field>
		</Page.Header>
		<Box display='flex' flexDirection='row'>
			<Tabs flexShrink={0} mbe='x8'>
				<Tabs.Item selected={tab === 'info'} onClick={() => setTab('info')}>{t('Info')}</Tabs.Item>
				<Tabs.Item selected={tab === 'files'} onClick={() => setTab('files')}>{t('Files')}</Tabs.Item>
				{/*<Tabs.Item selected={tab === 'answer'} onClick={() => setTab('answer')}>{t('Answer')}</Tabs.Item>*/}
			</Tabs>
			{/*<Box mis='auto'>*/}
			{/*	<Select options={answerStatusOptions} onChange={(value) => setAnswerStatusOptions(value)}/>*/}
			{/*</Box>*/}
		</Box>
		<Page.ScrollableContent>
			{
				// (tab === 'answer' && <AnswerForm defaultValues={values} defaultHandlers={handlers}/>)
				(tab === 'files' && <GenericTable header={header} renderRow={renderRow} results={files ?? []} total={files?.length || 0} setParams={setParams} params={params}/>)
				|| (tab === 'info' && <AnswerForm defaultValues={values} defaultHandlers={handlers} onReadOnly={true}/>)
			}
		</Page.ScrollableContent>
	</Page>;
}

function InfoData({ answer }) {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const areaInputStyle = { whiteSpace: 'normal', wordBreak: 'break-word' };

	return <Field display='flex' flexDirection='column' w='full' mbs='x8' mbe='x32' overflow='auto'>
		<Field mbe='x8'>
			<Field.Label>{t('Working_group_request_sender')}</Field.Label>
			<Field.Row>
				<TextInput readOnly placeholder={t('Working_group_request_sender')} is='span' fontScale='p1'>{answer.sender?.group ?? ''}</TextInput>
			</Field.Row>
		</Field>
		<Field mbe='x8'>
			<Field.Label>{t('Working_group_request_sender_organization')}</Field.Label>
			<Field.Row>
				<TextInput readOnly placeholder={t('Working_group_request_sender_organization')} is='span' fontScale='p1'>{answer.sender?.organization ?? ''}</TextInput>
			</Field.Row>
		</Field>
		<Field mbe='x8'>
			<Field.Label>{t('Phone_number')}</Field.Label>
			<Field.Row>
				<TextInput readOnly placeholder={t('Phone_number')} is='span' fontScale='p1'>{answer.sender?.phone ?? ''}</TextInput>
			</Field.Row>
		</Field>
		<Field mbe='x8'>
			<Field.Label>{t('Email')}</Field.Label>
			<Field.Row>
				<TextInput readOnly placeholder={t('Email')} is='span' fontScale='p1'>{answer.sender?.email ?? ''}</TextInput>
			</Field.Row>
		</Field>
		<Field mbe='x8'>
			<Field.Label>{t('Date')}</Field.Label>
			<Field.Row>
				<TextInput readOnly placeholder={t('Date')} is='span' fontScale='p1'>{formatDateAndTime(answer.ts)}</TextInput>
			</Field.Row>
		</Field>
		<Field mbe='x8'>
			<Field.Label>{t('Working_group_request_invite_select_protocol')}</Field.Label>
			<Field.Row>
				<TextAreaInput rows='2' style={areaInputStyle} value={answer.protocol?.title ?? ''} readOnly placeholder={t('Working_group_request_invite_select_protocol')} fontScale='p1'/>
			</Field.Row>
		</Field>
		<Field mbe='x8'>
			<Field.Label>{t('Working_group_request_invite_select_sections')}</Field.Label>
			<Field.Row>
				<TextAreaInput rows='2' style={areaInputStyle} value={answer.protocol?.section?.title ?? ''} readOnly placeholder={t('Working_group_request_invite_select_sections')} fontScale='p1'/>
			</Field.Row>
		</Field>
		<Field mbe='x8'>
			<Field.Label>{t('Working_group_request_invite_select_sections_items')}</Field.Label>
			<Field.Row>
				<TextAreaInput rows='2' style={areaInputStyle} value={answer.protocol?.sectionItem?.title ?? ''} readOnly placeholder={t('Working_group_request_invite_select_sections_items')} fontScale='p1'/>
			</Field.Row>
		</Field>
		<Field mbe='x8'>
			<Field.Label>{t('Commentary')}</Field.Label>
			<Field.Row>
				<TextAreaInput rows='2' style={{ whiteSpace: 'normal' }} value={answer.commentary ?? ''} readOnly placeholder={t('Commentary')} fontScale='p1'/>
			</Field.Row>
		</Field>
	</Field>;
}
