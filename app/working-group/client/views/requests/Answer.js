import React, { useCallback, useMemo, useState } from 'react';
import { Button, Field, Icon, Label, Table, TextInput, TextAreaInput, Tabs, Box, Skeleton } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';

import Page from '../../../../../client/components/basic/Page';
import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { GenericTable, Th } from '../../../../../client/components/GenericTable';
import { useFormatDateAndTime } from '../../../../../client/hooks/useFormatDateAndTime';
import { useRouteParameter } from '../../../../../client/contexts/RouterContext';
import { ENDPOINT_STATES, useEndpointDataExperimental } from '../../../../../client/hooks/useEndpointDataExperimental';
import { GoBackButton } from '../../../../utils/client/views/GoBackButton';

export function Answer({ answer, router, requestId }) {
	const data = {
		documents: [],
		ts: '',
	};

	const query = useMemo(() => ({ query: JSON.stringify({ _id: answer ? { $in: answer.documents?.map((doc) => doc._id ?? '') } : data }) }), [answer]);

	const { data: files, state, error } = useEndpointDataExperimental('upload-files.list', query);

	if (state === ENDPOINT_STATES.LOADING) {
		return <Box w='full' pb='x24'>
			<Skeleton mbe='x4'/>
			<Skeleton mbe='x8' />
			<Skeleton mbe='x4'/>
			<Skeleton mbe='x8'/>
			<Skeleton mbe='x4'/>
			<Skeleton mbe='x8'/>
		</Box>;
	}

	if (state === ENDPOINT_STATES.ERROR) {
		return error.message;
	}

	return <AnswerWithData answer={answer ?? data} files={files.files} router={router} requestId={requestId}/>;
}

function AnswerWithData({ answer, files, router, requestId }) {
	const t = useTranslation();

	const tab = useRouteParameter('tab');

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });

	const handleTabClick = useCallback((tab) => () => router.push({ id: requestId, context: 'answer', tab }), [router]);

	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const onDownloadClick = (_id) => async (e) => {
		e.preventDefault();
		const index = files.findIndex((_file) => _file._id === _id);
		if (index < 0) {
			return;
		}

		const file = files[index];
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
		const { _id, title } = document;
		return <Table.Row tabIndex={0} role='link' action>
			<Table.Cell fontScale='p1' color='default'>{title}</Table.Cell>
			<Table.Cell alignItems={'end'}>
				<Button onClick={onDownloadClick(_id)} small aria-label={t('download')}>
					<Icon name='download'/>
				</Button>
			</Table.Cell>
		</Table.Row>;
	};

	return <Page>
		<Page.Header>
			<Field width={'100%'} display={'block'} marginBlock={'15px'}>
				<GoBackButton/>
				<Label fontScale='h1'>{t('Working_group_received_answer')}</Label>
			</Field>
		</Page.Header>
		<Tabs flexShrink={0} mbe='x8'>
			<Tabs.Item selected={tab === 'info'} onClick={handleTabClick('info')}>{t('Info')}</Tabs.Item>
			<Tabs.Item selected={tab === 'files'} onClick={handleTabClick('files')}>{t('Files')}</Tabs.Item>
		</Tabs>
		<Page.Content>
			{ (tab === 'info' && <InfoData answer={answer}/>)
				|| (tab === 'files' && <GenericTable header={header} renderRow={renderRow} results={answer.documents ?? []} total={answer.documents?.length || 0} setParams={setParams} params={params}/>)
			}
		</Page.Content>
	</Page>;
}

function InfoData({ answer }) {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();

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
				<TextInput readOnly placeholder={t('Phone_number')} is='span' fontScale='p1'>{answer.phone ?? ''}</TextInput>
			</Field.Row>
		</Field>
		<Field mbe='x8'>
			<Field.Label>{t('Email')}</Field.Label>
			<Field.Row>
				<TextInput readOnly placeholder={t('Email')} is='span' fontScale='p1'>{answer.email ?? ''}</TextInput>
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
				<TextAreaInput rows='2' style={{ whiteSpace: 'normal' }} value={answer.protocol ?? ''} readOnly placeholder={t('Working_group_request_invite_select_protocol')} fontScale='p1'/>
			</Field.Row>
		</Field>
		<Field mbe='x8'>
			<Field.Label>{t('Working_group_request_invite_select_sections')}</Field.Label>
			<Field.Row>
				<TextAreaInput rows='2' style={{ whiteSpace: 'normal' }} value={answer.section ?? ''} readOnly placeholder={t('Working_group_request_invite_select_sections')} fontScale='p1'/>
			</Field.Row>
		</Field>
		<Field mbe='x8'>
			<Field.Label>{t('Working_group_request_invite_select_sections_items')}</Field.Label>
			<Field.Row>
				<TextAreaInput rows='2' style={{ whiteSpace: 'normal' }} value={answer.sectionItem ?? ''} readOnly placeholder={t('Working_group_request_invite_select_sections_items')} fontScale='p1'/>
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
