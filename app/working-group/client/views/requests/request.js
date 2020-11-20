import React, { useCallback, useMemo, useState } from 'react';
import { Button, ButtonGroup, Field, Icon, Label, TextInput } from '@rocket.chat/fuselage';

import Page from '../../../../../client/components/basic/Page';
import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { useRoute, useRouteParameter } from '../../../../../client/contexts/RouterContext';
import { useEndpointData } from '../../../../../client/hooks/useEndpointData';
import { useFormatDate } from '../../../../../client/hooks/useFormatDate';
import { settings } from '../../../../settings/client';

import { Mails } from './Mails';
import { Answers } from './Answers';
import { AddMail } from './AddMail';
import VerticalBar from '../../../../../client/components/basic/VerticalBar';

export function DocumentPage() {
	const t = useTranslation();
	const formatDate = useFormatDate();

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });
	const [cache, setCache] = useState();
	const [currentMail, setCurrentMail] = useState({});
	const [currentMailIndex, setCurrentMailIndex] = useState({});

	const router = useRoute('working-groups-request');
	const context = useRouteParameter('context');
	const requestId = useRouteParameter('id');

	const query = useMemo(() => ({
		query: JSON.stringify({ _id: requestId }),
	}), [requestId]);

	// const filesQuery = useMemo(() => ({
	// 	query: JSON.stringify({ workingGroupRequestId: requestId }),
	// 	//fields: JSON.stringify({  }),
	// 	sort: JSON.stringify({ ['uploadedAt']: -1 }),
	// 	count: 25,
	// }), [requestId]);
	//
	// const filesData = useEndpointData('upload-files.list', filesQuery) || { files: [] };
	// const filesArray = useMemo(() => filesData.files ?? [], [filesData]);
	// console.log(filesData);

	const data = useEndpointData('working-groups-requests.findOne', query) || { mails: [] };
	const mails = useMemo(() => data.mails ?? [], [data]);
	const address = [settings.get('Site_Url'), 'd/', data.inviteLink].join('') || '';

	const onChange = useCallback(() => {
		console.log('onchange');
		setCache(new Date());
	}, [cache]);

	const close = useCallback(() => {
		router.push({
			id: requestId,
		});
	}, [router]);

	const handleHeaderButtonClick = useCallback((context) => () => {
		router.push({ id: requestId, context });
	}, [router]);

	const onMailClick = useCallback((curMail) => () => {
		const index = mails.findIndex((mail) => JSON.stringify(mail) === JSON.stringify(curMail));
		setCurrentMail(curMail ?? {});
		setCurrentMailIndex(index);
		router.push({ id: requestId, context: 'answer' });
	}, [router]);

	const onAddMailClick = useCallback((newMail) => () => {
		if (newMail) {
			mails.push(newMail);
		}
		router.push({ id: requestId });
	}, [router, mails]);

	const goBack = () => {
		window.history.back();
	};

	return <Page flexDirection='row'>
		{context !== 'answer' && <Page>
			<Page.Header>
				<Field width={'100%'} display={'block'} marginBlock={'15px'}>
					<Button className='go-back-button' onClick={goBack}>
						<Icon name='back'/>
					</Button>
					<Label fontScale='h1'>{t('Working_group_request')}</Label>
				</Field>
				<ButtonGroup>
					<Button primary small aria-label={t('Add')} onClick={handleHeaderButtonClick('add')}>
						{t('Add')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.Content>
				<Field mbe='x8'>
					<Field.Label>{t('Description')}</Field.Label>
					<Field.Row>
						{/*<Label fontScale='p1'>{data.desc}</Label>*/}
						<TextInput readOnly placeholder={t('Description')} is='span' fontScale='p1'>{data.desc}</TextInput>
					</Field.Row>
				</Field>
				<Field mbe='x8'>
					<Field.Label>{t('Working_group_request_invite_link')}</Field.Label>
					<Field.Row>
						<a href={address} is='span' target='_blank'>{address}</a>
					</Field.Row>
				</Field>
				<Mails data={mails} onClick={onMailClick} params={params} setParams={setParams}/>
			</Page.Content>
		</Page>}
		{context === 'answer' && <Answers editData={currentMail.answers} mail={currentMail} mailIndex={currentMailIndex} onChange={onChange}/>}
		{context === 'add'
		&& <VerticalBar className='contextual-bar' width='x380' qa-context-name={`admin-user-and-room-context-${ context }`} flexShrink={0}>
			<VerticalBar.Header>
				{ context === 'add' && t('Add') }
				<VerticalBar.Close onClick={close}/>
			</VerticalBar.Header>
			{context === 'add' && <AddMail goToNew={onAddMailClick} close={close} requestId={requestId} onChange={onChange}/>}
		</VerticalBar>}
	</Page>;
}

DocumentPage.displayName = 'DocumentPage';

export default DocumentPage;
