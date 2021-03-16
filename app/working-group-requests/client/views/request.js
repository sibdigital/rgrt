import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, ButtonGroup, Callout, Field, Icon, Label, TextAreaInput, TextInput } from '@rocket.chat/fuselage';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { settings } from '../../../settings/client';
import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useRoute, useRouteParameter } from '../../../../client/contexts/RouterContext';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../../../client/hooks/useEndpointDataExperimental';
import { Mails } from './Mails';
import { Answers } from './Answers';
import { Answer } from './Answer';
import { AddMail } from './AddMail';
import VerticalBar from '../../../../client/components/basic/VerticalBar';
import { GoBackButton } from '../../../utils/client/views/GoBackButton';
import { useFormatDateAndTime } from '../../../../client/hooks/useFormatDateAndTime';
import { AddRequest } from './AddRequest';
import { hasPermission } from '../../../authorization';
import { useUserId } from '../../../../client/contexts/UserContext';

export function DocumentPage() {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });
	const [cache, setCache] = useState();
	const [currentMail, setCurrentMail] = useState({});
	const [currentAnswer, setCurrentAnswer] = useState({});
	const [number, setNumber] = useState('');
	const [date, setDate] = useState(new Date());
	const [desc, setDesc] = useState('');

	const router = useRoute('working-groups-request');
	const context = useRouteParameter('context');
	const requestId = useRouteParameter('id');

	const query = useMemo(() => ({
		query: JSON.stringify({ _id: requestId }),
	}), [requestId]);

	const data = useEndpointData('working-groups-requests.findOne', query);
	const { data: councilData, state: councilState } = useEndpointDataExperimental('councils.findOne',
		useMemo(() => ({
			query: JSON.stringify({ _id: data?.councilId ?? '' }),
			fields: JSON.stringify({ d: 1 }),
		}), [data]),
	);
	const { data: protocolData, state: protocolState } = useEndpointDataExperimental('protocols.findByItemId',
		useMemo(() => ({
			query: JSON.stringify({ _id: data?.protocolsItemId ?? '' }),
			fields: JSON.stringify({ num: 1, d: 1 }),
		}), [data]),
	);

	const mails = useMemo(() => data?.mails ?? [], [data]);
	const answers = useMemo(() => data?.answers ?? [], [data]);

	useEffect(() => {
		if (data) {
			setNumber(data.number ?? '');
			setDate(data.date && new Date(data.date));
			setDesc(data.desc);
		}
	}, [data]);

	const address = useMemo(() => [settings.get('Site_Url'), 'd/', data?.inviteLink ?? ''].join(''), [data]);

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

	const onRequestChanged = useCallback((request) => {
		setNumber(request.number);
		setDate(new Date(request.date));
		setDesc(request.desc);
	}, []);

	const onMailClick = useCallback((curMail) => () => {
		FlowRouter.go(`/working-groups-request/${ requestId }/answer/${ curMail._id }`);
	}, []);

	const onAddMailClick = useCallback((newMail) => () => {
		if (newMail) {
			console.log(newMail);
			console.log(mails);
			const index = mails.findIndex((mail) => mail._id === newMail._id);
			if (index < 0) {
				mails.push(newMail);
			} else {
				mails[index] = newMail;
			}
		}
		router.push({ id: requestId });
	}, [router, mails]);

	const goBack = () => {
		FlowRouter.go('working-groups-requests');
	};

	if (!hasPermission('manage-working-group-requests', useUserId())) {
		console.log('Permissions_access_missing');
		return <Callout m='x16' type='danger'>{t('Permissions_access_missing')}</Callout>;
	}

	return <Page flexDirection='row'>
		{(context !== 'answers' && context !== 'answer') && <Page>
			<Page.Header>
				<Field width={'100%'} display={'block'} marginBlock={'15px'}>
					<GoBackButton onClick={goBack}/>
					<Label fontScale='h1'>{t('Working_group_request')}</Label>
				</Field>
				<ButtonGroup>
					<Button primary small aria-label={t('Edit')} onClick={handleHeaderButtonClick('edit')}>
						{t('Edit')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.Content>
				<Field mbe='x16' display='flex' flexDirection='row'>
					<Field mie='x4'>
						<Field.Label>{t('Number')}</Field.Label>
						<Field.Row>
							<TextInput value={number} readOnly placeholder={t('Number')} fontScale='p1'/>
						</Field.Row>
					</Field>
					<Field mis='x4'>
						<Field.Label>{t('Date')}</Field.Label>
						<Field.Row>
							<TextInput value={formatDateAndTime(date)} readOnly placeholder={t('Date')} fontScale='p1'/>
						</Field.Row>
					</Field>
				</Field>
				{(councilData || protocolData?.protocol) && <Field mbe='x16' display='flex' flexDirection='row'>
					{councilData && <Field mie='x4'>
						<Field.Label>{t('Council')}</Field.Label>
						<Field.Row>
							<TextInput value={['От ', formatDateAndTime(councilData.d)].join('')} readOnly placeholder={t('Council')} fontScale='p1'/>
						</Field.Row>
					</Field>}
					{protocolData?.protocol[0] && <Field mis='x4'>
						<Field.Label>{t('Protocol')}</Field.Label>
						<Field.Row>
							<TextInput value={['№', protocolData.protocol[0].num, ' от ', formatDateAndTime(protocolData.protocol[0].d)].join('')} readOnly placeholder={t('Protocol')} fontScale='p1'/>
						</Field.Row>
					</Field>}
				</Field>}
				<Field mbe='x16'>
					<Field.Label>{t('Protocol_Item')}</Field.Label>
					<Field.Row>
						<TextInput value={'ITEM'} readOnly placeholder={t('Protocol_Item')} fontScale='p1'/>
					</Field.Row>
				</Field>
				<Field mbe='x16'>
					<Field.Label>{t('Description')}</Field.Label>
					<Field.Row>
						<TextAreaInput rows='3' value={desc} readOnly placeholder={t('Description')} fontScale='p1'/>
					</Field.Row>
				</Field>
				<Field mbe='x16'>
					<Field.Label>{t('Working_group_request_invite_link')}</Field.Label>
					<Field.Row>
						<a href={address} is='span' target='_blank'>{address}</a>
					</Field.Row>
				</Field>
				{/*<Mails data={mails} onClick={onMailClick} onEditClick={onEditMailClick} params={params} setParams={setParams}/>*/}
				<Answers mail={data} onClick={onMailClick} editData={answers} onChange={onChange}/>
			</Page.Content>
		</Page>}
		{(context === 'add' || context === 'editMail' || context === 'edit')
		&& <VerticalBar className='contextual-bar' width='x380' qa-context-name={`admin-user-and-room-context-${ context }`} flexShrink={0}>
			<VerticalBar.Header>
				{ context === 'add' && t('Add') }
				{ context === 'editMail' && t('Edit') }
				{ context === 'edit' && t('Edit') }
				<VerticalBar.Close onClick={close}/>
			</VerticalBar.Header>
			{context === 'add' && <AddMail goToNew={onAddMailClick} close={close} requestId={requestId} onChange={onChange}/>}
			{context === 'editMail' && <AddMail data={currentMail} goToNew={onAddMailClick} close={close} requestId={requestId} onChange={onChange}/>}
			{context === 'edit' && <AddRequest onChange={onChange} editData={{ _id: data._id, number, date, desc }} onRequestChanged={onRequestChanged}/>}
		</VerticalBar>}
	</Page>;
}

DocumentPage.displayName = 'DocumentPage';

export default DocumentPage;
