import React, { useCallback, useMemo, useState } from 'react';
import {
	Box,
	Button,
	ButtonGroup, Callout,
	Field, FieldGroup,
	Label,
	SelectFiltered,
	Skeleton,
	TextAreaInput,
	TextInput
} from '@rocket.chat/fuselage';
import DatePicker, { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';

import Page from '../../../../../client/components/basic/Page';
import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { useToastMessageDispatch } from '../../../../../client/contexts/ToastMessagesContext';
import { useMethod } from '../../../../../client/contexts/ServerContext';
import { useRouteParameter } from '../../../../../client/contexts/RouterContext';
import { useForm } from '../../../../../client/hooks/useForm';
import { useFormatDate } from '../../../../../client/hooks/useFormatDate';
import { useUserId } from '../../../../../client/contexts/UserContext';
import { ENDPOINT_STATES, useEndpointDataExperimental } from '../../../../../client/hooks/useEndpointDataExperimental';
import { errandStatuses } from '../../../utils/statuses';
import { GoBackButton } from '../../../../utils/client/views/GoBackButton';
import { settings } from '../../../../settings';
import { constructPersonFullFIO } from '../../../../utils/client/methods/constructPersonFIO';

registerLocale('ru', ru);
require('react-datepicker/dist/react-datepicker.css');

export function EditErrandPage() {
	const t = useTranslation();

	const id = useRouteParameter('id');
	const userId = useUserId();

	const query = useMemo(() => ({
		query: JSON.stringify({
			_id: id,
		}),
		sort: JSON.stringify({ ts: -1 }),
		count: 1,
		offset: 0,
	}), [id]);

	const { data, state, error } = useEndpointDataExperimental('errands', query);
	const { data: personData, state: personState, error: personError } = useEndpointDataExperimental('users.getPerson', useMemo(() => ({ query: JSON.stringify({ userId }) }), [userId]));

	if ([state, personState].includes(ENDPOINT_STATES.LOADING)) {
		return <Box w='full' pb='x24'>
			<Skeleton mbe='x4'/>
			<Skeleton mbe='x8' />
			<Skeleton mbe='x4'/>
			<Skeleton mbe='x8'/>
			<Skeleton mbe='x4'/>
			<Skeleton mbe='x8'/>
		</Box>;
	}

	if (error || personError) {
		return <Callout m='x16' type='danger'>{error}</Callout>;
	}

	return <EditErrand errand={data.result[0]} currentPerson={personData}/>;
}

const getInitialValue = (data) => {
	const value = {
		_id: data._id,
		t: data.t,
		ts: data.ts,
		initiatedBy: data.initiatedBy,
		chargedTo: data.chargedTo,
		desc: data.desc,
		expireAt: data.expireAt ?? '',
		comment: data.comment ?? '',
	}
	if (data.protocol) {
		value.protocol = data.protocol;
	}
	return value;
};

function EditErrand({ errand, currentPerson }) {
	const _t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const formatDate = useFormatDate();

	const updateErrand = useMethod('editErrand');

	const { values, handlers, reset, hasUnsavedChanges } = useForm(getInitialValue(errand));

	const {
		_id,
		t,
		ts,
		initiatedBy,
		chargedTo,
		desc,
		expireAt,
		protocol,
		comment,
	} = values;

	const {
		handleT,
		handleComment,
	} = handlers;

	const saveQuery = useMemo(() => values, [JSON.stringify(values)]);

	const saveAction = useCallback(async (errandData) => {
		const _id = await updateErrand(errandData);
		return _id;
	}, [updateErrand]);

	const handleSave = useCallback(async () => {
		const result = await saveAction(saveQuery);
		dispatchToastMessage({ type: 'success', message: _t('Errand_Updated_Successfully') });
		// FlowRouter.go(`/errand/${ _id }`);
	}, [dispatchToastMessage, saveAction, saveQuery, _t]);

	const onEmailSendClick = () => {
		// onClose();
		FlowRouter.go(`/manual-mail-sender/errand/${ _id }`);
	};

	const protocolUrl = protocol ? [settings.get('Site_Url'), 'protocol/', protocol._id].join('') : '';
	const protocolItemUrl = protocol && protocol.sectionId && protocol.itemId ? [settings.get('Site_Url'), 'protocol/', protocol._id, '/', 'edit-item/', protocol.sectionId, '/', protocol.itemId].join('') : protocolUrl;
	const protocolTitle = protocol ? _t('Protocol') + ' от ' + formatDate(protocol.d) + ' № ' + protocol.num : '';

	const inputStyles = useMemo(() => ({ wordBreak: 'break-word', whiteSpace: 'normal', border: '1px solid #4fb0fc' }), []);

	const availableStatuses = errandStatuses.map((value) => [value, _t(value)]);

	const chargedToCurrentUser = currentPerson._id === chargedTo._id;

	const commentField = chargedToCurrentUser ? <TextAreaInput rows={3} flexGrow={1} value={comment} onChange={handleComment}/> : <TextAreaInput rows={3} flexGrow={1} value={comment}/>

	return <Page flexDirection='row'>
		<Page>
			<Page.Header title=''>
				<Field width={'100%'} display={'block'} marginBlock={'15px'}>
					<GoBackButton/>
					<Label fontScale='h1'>{_t('Errand')}</Label>
				</Field>
				<ButtonGroup mis='auto'>
					{ !chargedToCurrentUser && <Button primary small aria-label={_t('Save')} onClick={onEmailSendClick}>{_t('Send_email')}</Button>}
					<Button disabled={!hasUnsavedChanges} primary small aria-label={_t('Save')} onClick={handleSave}>
						{_t('Save')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.ScrollableContent padding='x24'>
				<FieldGroup>
					{useMemo(() => <Field>
						<Field.Label>{_t('Errand_Initiated_by')}</Field.Label>
						<Field.Row>
							<TextInput flexGrow={1} value={constructPersonFullFIO(initiatedBy ?? '')}/>
						</Field.Row>
					</Field>, [_t, initiatedBy])}
					{useMemo(() => <Field>
						<Field.Label>{_t('Errand_Charged_to')}</Field.Label>
						<Field.Row>
							<TextInput flexGrow={1} value={constructPersonFullFIO(chargedTo?.person ?? '')}/>
						</Field.Row>
					</Field>, [_t, chargedTo])}
					{useMemo(() => <Field>
						<Field.Label>{_t('Errand_Created_At')}</Field.Label>
						<Field.Row>
							<TextInput flexGrow={1} value={formatDate(ts)}/>
						</Field.Row>
					</Field>, [_t, chargedTo])}
					{useMemo(() => <Field display='flex' flexDirection='row'>
						<Field mie='x8'>
							<Field.Label>{_t('Errand_Expired_date')}</Field.Label>
							<Field.Row>
								<DatePicker
									dateFormat='dd.MM.yyyy'
									selected={new Date(expireAt)}
									customInput={<TextInput />}
									locale='ru'
								/>
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{_t('Status')}</Field.Label>
							<Field.Row>
								<SelectFiltered style={inputStyles} options={availableStatuses} value={t} key='status' onChange={handleT} placeholder={_t('Status')}/>
							</Field.Row>
						</Field>
					</Field>, [_t, expireAt, t, handleT])}
					{protocol && useMemo(() => <Field display='flex' flexDirection='row'>
						<Field mie='x8'>
							<Field.Label>{_t('Protocol')}</Field.Label>
							<Field.Row>
								<a href={protocolUrl}>{protocolTitle}</a>
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{_t('Protocol_Item')}</Field.Label>
							<Field.Row>
								<a href={protocolItemUrl}>{protocolTitle}</a>
							</Field.Row>
						</Field>
					</Field>, [_t, protocol])}
					{useMemo(() => <Field>
						<Field.Label>{_t('Description')}</Field.Label>
						<Field.Row>
							<TextAreaInput style={inputStyles} rows={3} flexGrow={1} value={desc}/>
						</Field.Row>
					</Field>, [_t, desc])}
					{useMemo(() => <Field>
						<Field.Label>{_t('Commentary')}</Field.Label>
						<Field.Row>
							{commentField}
						</Field.Row>
					</Field>, [_t, comment, handleComment])}
				</FieldGroup>
			</Page.ScrollableContent>
		</Page>
	</Page>;
}

EditErrandPage.displayName = 'EditErrandPage';

export default EditErrandPage;
