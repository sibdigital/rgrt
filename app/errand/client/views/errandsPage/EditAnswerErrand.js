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
	Skeleton, Callout, ButtonGroup,
} from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { FlowRouter } from 'meteor/kadira:flow-router';

import Page from '../../../../../client/components/basic/Page';
import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { GenericTable, Th } from '../../../../../client/components/GenericTable';
import { useRoute, useRouteParameter } from '../../../../../client/contexts/RouterContext';
import { ENDPOINT_STATES, useEndpointDataExperimental } from '../../../../../client/hooks/useEndpointDataExperimental';
import { useEndpointData } from '../../../../../client/hooks/useEndpointData';
import { GoBackButton } from '../../../../utils/client/views/GoBackButton';
import { hasPermission } from '../../../../authorization';
import { useMethod } from '../../../../../client/contexts/ServerContext';
import { useUserId } from '../../../../../client/contexts/UserContext';
import AnswerForm, {
	useDefaultAnswerErrandForm,
	getAnswerErrandFields,
} from '../../../../working-group-requests/client/views/AnswerForm';

export function EditAnswerErrand() {
	const t = useTranslation();
	const requestId = useRouteParameter('requestid');

	const query = useMemo(() => ({
		query: JSON.stringify({ _id: requestId }),
	}), [requestId]);

	const { data: answerData, state: answerState, error: answerError } = useEndpointDataExperimental('working-groups-requests.findOne', query);
	//
	// const filesQuery = useMemo(() => ({ query: JSON.stringify({ _id: data ? { $in: data.documents?.map((doc) => doc._id ?? '') } : {} }) }), [data]);
	//
	// const { data: files, state, error } = useEndpointDataExperimental('upload-files.list', filesQuery);
	//
	// useMemo(() => console.log(files), [files]);

	if (!hasPermission('manage-working-group-requests', useUserId())) {
		console.log('Permissions_access_missing');
		return <Callout m='x16' type='danger'>{t('Permissions_access_missing')}</Callout>;
	}

	if ([answerState].includes(ENDPOINT_STATES.LOADING)) {
		return <Box w='full' pb='x24'>
			<Skeleton mbe='x4'/>
			<Skeleton mbe='x8'/>
			<Skeleton mbe='x4'/>
			<Skeleton mbe='x8'/>
			<Skeleton mbe='x4'/>
			<Skeleton mbe='x8'/>
		</Box>;
	}

	if ([answerState].includes(ENDPOINT_STATES.ERROR)) {
		return <Callout m='x16' type='danger'>{t(answerError.message)}</Callout>;
	}

	return <AnswerWithData answer={answerData ?? {}} workingGroupRequestId={requestId} files={[]}/>;
}

EditAnswerErrand.displayName = 'EditAnswerErrand';

export default EditAnswerErrand;

function AnswerWithData({ answer, workingGroupRequestId, files }) {
	const t = useTranslation();

	const [tab, setTab] = useState('answer');
	const [answerStatusOptions, setAnswerStatusOptions] = useState([]);

	const insertOrUpdateErrand = useMethod('insertOrUpdateErrand');

	const answerForm = getAnswerErrandFields({ answer });

	const { values, handlers, allFieldAreFilled } = useDefaultAnswerErrandForm({ defaultValues: answerForm });

	const handleSave = useCallback(async () => {
		try {
			await insertOrUpdateErrand({ ...values, workingGroupRequestId, errandType: { state: 2, title: t('Answer') } });
			FlowRouter.go('/errands/charged_to_me');
		} catch (error) {
			console.log(error);
		}
	}, [insertOrUpdateErrand, values, workingGroupRequestId, t]);
	useMemo(() => console.log({ answerForm, answer, values }), [answerForm, answer, values]);

	return <Page>
		<Page.Header title=''>
			<Field width={'100%'} display={'block'} marginBlock={'15px'}>
				<GoBackButton/>
				<Label fontScale='h1'>{t('Errand')}</Label>
			</Field>
			<ButtonGroup mis='auto'>
				<Button primary small aria-label={t('Save')} onClick={handleSave}>
					{t('Save')}
				</Button>
			</ButtonGroup>
		</Page.Header>
		<Box display='flex' flexDirection='row'>
			<Tabs flexShrink={0} mbe='x8'>
				<Tabs.Item selected={tab === 'answer'} onClick={() => setTab('answer')}>{t('Info')}</Tabs.Item>
				<Tabs.Item selected={tab === 'files'} onClick={() => setTab('files')}>{t('Files')}</Tabs.Item>
			</Tabs>
		</Box>
		<Page.ScrollableContent>
			{
				(tab === 'answer' && <AnswerForm defaultValues={values} defaultHandlers={handlers} onAnswerErrand={true}/>)
				|| (tab === 'files' && <AnswerFilesTable files={files}/>)
				// || (tab === 'files' && <GenericTable header={header} renderRow={renderRow} results={files ?? []} total={files?.length || 0} setParams={setParams} params={params}/>)
			}
		</Page.ScrollableContent>
	</Page>;
}

function AnswerFilesTable({ files }) {
	const t = useTranslation();
	const mediaQuery = useMediaQuery('(min-width: 768px)');

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

	return <GenericTable header={header} renderRow={renderRow} results={files ?? []} total={files?.length || 0}/>;
}
