import React, { useCallback, useMemo } from 'react';
import {
	Box,
	Button,
	ButtonGroup, Callout,
	Field,
	FieldGroup,
	Label, Skeleton,
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
import { ENDPOINT_STATES, useEndpointDataExperimental } from '../../../../../client/hooks/useEndpointDataExperimental';
import { useForm } from '../../../../../client/hooks/useForm';
import { useFormatDate } from '../../../../../client/hooks/useFormatDate';
import { GoBackButton } from '../../../../utils/client/views/GoBackButton';

registerLocale('ru', ru);
require('react-datepicker/dist/react-datepicker.css');

export function AddErrandByProtocolItemPage() {
	const t = useTranslation();

	const itemId = useRouteParameter('itemId');

	const { data: protocolData, state, error } = useEndpointDataExperimental('protocols.findByItemId', useMemo(() => ({ query: JSON.stringify({ _id: itemId }) }), [itemId]));

	if ([state].includes(ENDPOINT_STATES.LOADING)) {
		return <Box w='full' pb='x24'>
			<Skeleton mbe='x8'/>
			<Skeleton mbe='x4'/>
			<Skeleton mbe='x4'/>
			<Skeleton mbe='x8'/>
			<Skeleton mbe='x4'/>
			<Skeleton mbe='x8'/>
		</Box>;
	}

	if (error) {
		return <Callout m='x16' type='danger'>{t('Item_not_found')}</Callout>;
	}

	return <AddErrandByProtocolItem protocolData={protocolData.protocol[0]} itemId={itemId}/>;
}

function AddErrandByProtocolItem({ protocolData, itemId }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const formatDate = useFormatDate();

	const createErrand = useMethod('createErrand');

	const section = protocolData.sections.filter((section) => section.items.find((item) => item._id === itemId))[0];
	const item = section.items.find(item => item._id === itemId);
	const itemResponsible = item?.responsible[0];

	const {
		values,
		handlers,
		reset,
		hasUnsavedChanges,
	} = useForm({
		chargedTo: {
			_id: itemResponsible._id,
			surname: itemResponsible.surname,
			name: itemResponsible.name,
			patronymic: itemResponsible.patronymic,
		},
		desc: $(item?.name).text(),
		expireAt: '',
		protocol: {
			_id: protocolData._id,
			num: protocolData.num,
			d: protocolData.d,
			sectionId: section._id,
			itemId: item._id,
		}
	});

	const {
		chargedTo,
		desc,
		expireAt,
	} = values;

	const {
		handleDesc,
		handleExpireAt,
	} = handlers;

	const protocolTitle = t('Protocol').concat(' ').concat(t('Date_to')).concat(' ').concat(formatDate(protocolData.d)).concat(' ').concat(' № ').concat(protocolData.num);

	const saveQuery = useMemo(() => values, [JSON.stringify(values)]);

	const saveAction = useCallback(async (errandData) => {
		const _id = await createErrand(errandData);
		return _id;
	}, [createErrand]);

	const handleSave = useCallback(async () => {
		try {
			const result = await saveAction(saveQuery);
			dispatchToastMessage({ type: 'success', message: t('Errand_Added_Successfully') });
			FlowRouter.go(`/protocol/${ protocolData._id }`);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [dispatchToastMessage, saveAction, saveQuery, t]);

	return <Page flexDirection='row'>
		<Page>
			<Page.Header title=''>
				<Field width={'100%'} display={'block'} marginBlock={'15px'}>
					<GoBackButton/>
					<Label fontScale='h1'>{t('Errand')}</Label>
				</Field>
				<ButtonGroup mis='auto'>
					<Button disabled={!hasUnsavedChanges} primary small aria-label={t('Save')} onClick={handleSave}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.ScrollableContent padding='x24'>
				<FieldGroup>
					{useMemo(() => <Field>
						<Field.Label>{t('Errand_Charged_to')}</Field.Label>
						<Field.Row>
							<TextInput flexGrow={1} value={chargedTo.surname + ' ' + chargedTo.name + ' ' + chargedTo.patronymic}/>
						</Field.Row>
					</Field>, [t, chargedTo])}
					{useMemo(() => <Field>
						<Field.Label>{t('Errand_Expired_date')}</Field.Label>
						<Field.Row>
							<DatePicker
								dateFormat='dd.MM.yyyy'
								selected={expireAt}
								onChange={handleExpireAt}
								customInput={<TextInput />}
								locale='ru'
							/>
						</Field.Row>
					</Field>, [t, expireAt, handleExpireAt])}
					{useMemo(() => <Field display='flex' flexDirection='row'>
						<Field mie='x8'>
							<Field.Label>{t('Protocol')}</Field.Label>
							<Field.Row>
								<TextInput flexGrow={1} value={protocolTitle}/>
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Protocol_Item')}</Field.Label>
							<Field.Row>
								<TextInput flexGrow={1} value={item.num}/>
							</Field.Row>
						</Field>
					</Field>, [t, protocolData])}
					{useMemo(() => <Field>
						<Field.Label>{t('Description')}</Field.Label>
						<Field.Row>
							<TextAreaInput rows={3} flexGrow={1} value={desc} onChange={handleDesc}/>
						</Field.Row>
					</Field>, [t, desc, handleDesc])}
				</FieldGroup>
			</Page.ScrollableContent>
		</Page>
	</Page>;
}

AddErrandByProtocolItemPage.displayName = 'AddErrandByProtocolItemPage';

export default AddErrandByProtocolItemPage;
