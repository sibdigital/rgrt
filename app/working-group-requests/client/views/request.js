import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, ButtonGroup, Callout, Field, Icon, Label, TextAreaInput, TextInput } from '@rocket.chat/fuselage';
import { FlowRouter } from 'meteor/kadira:flow-router';
import DatePicker, { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';

import { settings } from '../../../settings/client';
import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useRoute, useRouteParameter } from '../../../../client/contexts/RouterContext';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../../../client/hooks/useEndpointDataExperimental';
import { Answers } from './Answers';
import { GoBackButton } from '../../../utils/client/views/GoBackButton';
import { useFormatDateAndTime } from '../../../../client/hooks/useFormatDateAndTime';
import { hasPermission } from '../../../authorization';
import { useUserId } from '../../../../client/contexts/UserContext';
import { createWorkingGroupRequestData, validateWorkingGroupRequestData } from './lib';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useMethod } from '../../../../client/contexts/ServerContext';

registerLocale('ru', ru);
require('react-datepicker/dist/react-datepicker.css');

export function DocumentPage() {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const formatDateAndTime = useFormatDateAndTime();

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });
	const [cache, setCache] = useState(new Date());
	const [number, setNumber] = useState('');
	const [date, setDate] = useState(new Date());
	const [desc, setDesc] = useState('');
	const [itemResponsible, setItemResponsible] = useState('');

	const router = useRoute('working-groups-request');
	const context = useRouteParameter('context');
	const requestId = useRouteParameter('id');

	const query = useMemo(() => ({
		query: JSON.stringify({ _id: requestId }),
		cache: JSON.stringify({ cache }),
	}), [requestId, cache]);

	const data = useEndpointData('working-groups-requests.findOne', query);
	const { data: councilData, state: councilState } = useEndpointDataExperimental('councils.findOne',
		useMemo(() => ({
			query: JSON.stringify({ _id: data?.councilId ?? '' }),
			fields: JSON.stringify({ d: 1 }),
		}), [data]),
	);
	const { data: protocolData, state: protocolState } = useEndpointDataExperimental('protocols.findByItemId',
		useMemo(() => ({
			query: JSON.stringify({ $or: [{ _id: data?.protocolsItemId ?? '' }, { _id: data?.protocolId ?? '' }] }),
			fields: JSON.stringify({ num: 1, d: 1 }),
		}), [data]),
	);

	const answers = useMemo(() => data?.answers ?? [], [data]);

	useEffect(() => {
		if (data) {
			console.log(data);
			setNumber(data.number ?? '');
			setDate(data.date && new Date(data.date));
			setDesc(data.desc);
			setItemResponsible(data.protocol.itemResponsible);
		}
	}, [data]);

	const address = useMemo(() => [settings.get('Site_Url'), 'd/', data?.inviteLink ?? ''].join(''), [data]);

	const hasUnsavedChanges = useMemo(() => new Date(data?.date).getTime() !== new Date(date).getTime()
		|| data?.desc !== desc
		|| data?.number !== number
	, [date, desc, number, data]);

	const inputStyles = { wordBreak: 'break-word', whiteSpace: 'normal', border: '1px solid #4fb0fc' };

	const insertOrUpdateWorkingGroupRequest = useMethod('insertOrUpdateWorkingGroupRequest');

	const onChange = useCallback(() => {
		setCache(new Date());
	}, []);

	// const close = useCallback(() => {
	// 	router.push({
	// 		id: requestId,
	// 	});
	// }, [requestId, router]);

	const onMailClick = useCallback((curMail) => () => {
		FlowRouter.go(`/working-groups-request/${ requestId }/answer/${ curMail._id }`);
	}, [requestId]);

	const goBack = () => {
		FlowRouter.go('working-groups-requests');
	};


	const saveAction = useCallback(async (number, desc, date) => {
		const { _id } = data;
		const requestData = createWorkingGroupRequestData(number, desc, date, { _id }, itemResponsible);
		const validation = validateWorkingGroupRequestData(requestData);
		if (validation.length === 0) {
			const _id = await insertOrUpdateWorkingGroupRequest(requestData);
			return _id;
		}
		validation.forEach((error) => { throw new Error({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }); });
	}, [dispatchToastMessage, insertOrUpdateWorkingGroupRequest, number, desc, date, t]);

	const handleSaveRequest = useCallback(async () => {
		const result = await saveAction(number, desc, date, itemResponsible);
		if (!result) {
			dispatchToastMessage({ type: 'success', message: t('Working_group_request_added') });
		} else {
			dispatchToastMessage({ type: 'success', message: t('Working_group_request_edited') });
		}
		onChange();
	}, [saveAction, number, desc, date, itemResponsible]);


	if (!hasPermission('manage-working-group-requests', useUserId())) {
		console.log('Permissions_access_missing');
		return <Callout m='x16' type='danger'>{t('Permissions_access_missing')}</Callout>;
	}

	return <Page flexDirection='row'>
		<Page>
			<Page.Header>
				<Field width={'100%'} display={'block'} marginBlock={'15px'}>
					<GoBackButton onClick={goBack}/>
					<Label fontScale='h1'>{t('Working_group_request')}</Label>
				</Field>
				<ButtonGroup>
					<Button primary small aria-label={t('Save')} onClick={handleSaveRequest}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.ScrollableContent padding='x24'>
				<Field mbs='x4' mbe='x16' display='flex' flexDirection='row'>
					<Field display='flex' flexDirection='row'>
						<Field.Label maxWidth='100px' alignSelf='center' mie='x16' style={{ flex: '0 0 0' }}>{t('Number')}</Field.Label>
						<TextInput mie='x12' value={number} style={ inputStyles } placeholder={t('Number')} onChange={(e) => setNumber(e.currentTarget.value)} fontScale='p1'/>
					</Field>
					<Field mis='x4' display='flex' flexDirection='row'>
						<Field.Label alignSelf='center' mie='x16' style={{ flex: '0 0 0' }}>{t('Date')}</Field.Label>
						<DatePicker
							mie='x16'
							dateFormat='dd.MM.yyyy HH:mm'
							selected={date}
							onChange={(newDate) => setDate(newDate)}
							showTimeSelect
							timeFormat='HH:mm'
							timeIntervals={5}
							timeCaption='Время'
							customInput={<TextInput style={ inputStyles } />}
							locale='ru'
							popperClassName='date-picker'/>
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
					<Field.Label>{t('Errand_Charged_to')}</Field.Label>
					<Field.Row>
						<TextInput value={ itemResponsible } onChange={(e) => setItemResponsible(e.currentTarget.value)} placeholder={t('Errand_Charged_to')} fontScale='p1'/>
					</Field.Row>
				</Field>
				<Field mbe='x16'>
					<Field.Label>{t('Protocol_Item')}</Field.Label>
					<Field.Row>
						<TextInput value={t('Protocol_Item')} readOnly placeholder={t('Protocol_Item')} fontScale='p1'/>
					</Field.Row>
				</Field>
				<Field mbe='x16'>
					<Field.Label>{t('Description')}</Field.Label>
					<Field.Row>
						<TextAreaInput rows='3' value={desc} style={ inputStyles } placeholder={t('Description')} onChange={(e) => setDesc(e.currentTarget.value)} fontScale='p1'/>
					</Field.Row>
				</Field>
				<Field mbe='x16'>
					<Field.Label>{t('Working_group_request_invite_link')}</Field.Label>
					<Field.Row>
						<a href={address} is='span' target='_blank'>{address}</a>
					</Field.Row>
				</Field>
				<Answers mail={data} onClick={onMailClick} editData={answers} onChange={onChange}/>
			</Page.ScrollableContent>
		</Page>
		{/* {(context === 'add' || context === 'editMail' || context === 'edit')
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
		</VerticalBar>} */}
	</Page>;
}

DocumentPage.displayName = 'DocumentPage';

export default DocumentPage;
