import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
	Box,
	Button,
	ButtonGroup, Callout,
	Field,
	Label,
	Skeleton,
} from '@rocket.chat/fuselage';
import DatePicker, { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';
import { FlowRouter } from 'meteor/kadira:flow-router';

import Page from '../../../../../client/components/basic/Page';
import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { useToastMessageDispatch } from '../../../../../client/contexts/ToastMessagesContext';
import { useMethod } from '../../../../../client/contexts/ServerContext';
import { useRouteParameter } from '../../../../../client/contexts/RouterContext';
import { useUserId } from '../../../../../client/contexts/UserContext';
import { ENDPOINT_STATES, useEndpointDataExperimental } from '../../../../../client/hooks/useEndpointDataExperimental';
import { GoBackButton } from '../../../../utils/client/views/GoBackButton';
import { WorkingGroupRequestVerticalChooseBar } from '../../../../working-group-requests/client/views/RequestForm';
import ErrandForm, { useDefaultErrandForm, getErrandFieldsForSave } from './ErrandForm';
import { ErrandTypes } from '../../utils/ErrandTypes';
import { fileUploadToErrand } from '../../../../ui/client/lib/fileUpload';

registerLocale('ru', ru);
require('react-datepicker/dist/react-datepicker.css');

export function EditErrandPage() {
	const t = useTranslation();
	const userId = useUserId();

	const id = useRouteParameter('id');
	const idParams = useMemo(() => id.split('&'), [id]);

	const query = useMemo(() => ({
		query: JSON.stringify({
			_id: idParams[0] === 'add' ? '' : id,
		}),
		// sort: JSON.stringify({ ts: -1 }),
		// count: 1,
		// offset: 0,
	}), [id, idParams]);

	const { data, state, error } = useEndpointDataExperimental('errands.findOne', query);
	const { data: personData, state: personState } = useEndpointDataExperimental('users.getPerson', useMemo(() => ({
		query: JSON.stringify({ userId }),
		fields: JSON.stringify({ surname: 1, name: 1, patronymic: 1 }),
	}), [userId]));
	const { data: requestData, state: requestState } = useEndpointDataExperimental('working-groups-requests.findOne', useMemo(() => ({
		query: JSON.stringify({ _id: idParams[0] === 'add' ? idParams[2] : data?.workingGroupRequestId ?? '' }),
	}), [data, idParams]));

	if ([state, personState, requestState].includes(ENDPOINT_STATES.LOADING)) {
		return <Box w='full' pb='x24'>
			<Skeleton mbe='x4'/>
			<Skeleton mbe='x8' />
			<Skeleton mbe='x4'/>
			<Skeleton mbe='x8'/>
			<Skeleton mbe='x4'/>
			<Skeleton mbe='x8'/>
		</Box>;
	}

	if ([state, personState, requestState].includes(ENDPOINT_STATES.ERROR)) {
		console.log('error');
		return <Callout margin='x16' type='danger'>{error}</Callout>;
	}
	// console.dir({ idParams });
	// console.dir(idParams[0] === 'add' ? { errandType: ErrandTypes[idParams[1]] } : null);

	return <NewErrand errand={idParams[0] === 'add' ? { errandType: ErrandTypes[idParams[1]], initiatedBy: { ...personData, userId } } : data ?? null} request={requestData ?? null}/>;
}

export function NewErrand({ errand, request }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [context, setContext] = useState('');
	const [items, setItems] = useState([]);

	useEffect(() => {
		if (errand && errand._id && errand?.errandType?.key === ErrandTypes.byRequestAnswer.key && errand.protocol) {
			errand.protocol._id && errand.protocol.itemId && errand.protocol.num && setItems([{ _id: errand.protocol.itemId, num: errand.protocol.itemNum, sectionId: errand.protocol.sectionId ?? '' }]);
		}
	}, [errand]);

	const insertOrUpdateErrand = useMethod('insertOrUpdateErrand');

	const { values, handlers, hasUnsavedChanges, allFieldAreFilled, allRequiredFieldAreFilled } = useDefaultErrandForm({ defaultValues: errand, errandType: ErrandTypes[errand?.errandType?.key ?? 'default'] });

	const saveAction = useCallback(async (errandToSave, files) => {
		try {
			const errandId = await insertOrUpdateErrand(errandToSave);
			if (files && files.length > 0) {
				await fileUploadToErrand(files, { _id: errandId });
			}
			if (errandToSave._id) {
				dispatchToastMessage({ type: 'success', message: t('Errand_Updated_Successfully') });
				window.location.reload();
			} else {
				dispatchToastMessage({ type: 'success', message: t('Errand_Added_Successfully') });
				const id = errandId;
				FlowRouter.go(`/errand/${ id }`);
			}
		} catch (err) {
			console.error(err);
		}
	}, [dispatchToastMessage, insertOrUpdateErrand, t]);

	const handleSave = useCallback(async () => {
		const errandType = ErrandTypes[errand?.errandType?.key ?? 'default'];
		const files = errandType === ErrandTypes.byRequestAnswer ? values.documents?.value?.filter((doc) => doc.file) : [];
		const errandToSave = getErrandFieldsForSave({ errand: values, errandType });

		if (errand?.errandType?.key === ErrandTypes.byRequestAnswer.key) {
			request?._id && Object.assign(errandToSave, { workingGroupRequestId: request._id });
		}
		// console.log({ errandType, errandToSave, files });
		await saveAction(errandToSave, files);
	}, [errand, values, saveAction, request]);

	const handleChoose = useCallback((val, field, handleField) => {
		// console.log({ val, field, handleField });
		if (handlers[handleField]) {
			handlers[handleField]({ value: { ...values[field].value, num: val.num, d: val.d, _id: val._id }, required: values[field].required });
		}
		if (handleField === 'handleChargedTo') {
			handlers.handleChargedTo({ value: { person: val }, required: values.chargedTo.required });
		}
		if (handleField === 'handleProtocolItems') {
			handlers.handleProtocol({ value: { ...values.protocol.value, itemNum: val[0].num, sectionId: val[0].sectionId, itemId: val[0]._id }, required: values.protocol.required });
			setItems([...val]);
		}
	}, [handlers, values]);

	console.dir({ allFieldAreFilledInEditErrand: allFieldAreFilled, allRequiredFieldAreFilledInEditErrand: allRequiredFieldAreFilled });
	return <Page flexDirection='row'>
		<Page>
			<Page.Header title=''>
				<Field width={'100%'} display={'block'} marginBlock={'15px'}>
					<GoBackButton/>
					<Label fontScale='h1'>{t('Errand')}</Label>
				</Field>
				<ButtonGroup mis='auto'>
					{/*{ !chargedToCurrentUser && <Button primary small aria-label={_t('Save')} onClick={onEmailSendClick}>{t('Send_email')}</Button>}*/}
					<Button disabled={!allFieldAreFilled} primary small aria-label={t('Save')} onClick={handleSave}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.ScrollableContent padding='x24'>
				<ErrandForm errandId={errand?._id} defaultValues={values} defaultHandlers={handlers} onReadOnly={false} errandType={ErrandTypes[errand?.errandType?.key ?? 'default']} request={request} setItems={setItems} items={items} setContext={setContext}/>
			</Page.ScrollableContent>
		</Page>
		<WorkingGroupRequestVerticalChooseBar protocolItems={items} protocolId={values.protocol?.value?._id ?? ''} handlers={{ handleItemResponsible: (val) => handleChoose(val, 'chargedTo', 'handleChargedTo'), handleProtocol: (val) => handleChoose(val, 'protocol', 'handleProtocol'), handleProtocolItems: (val) => handleChoose(val, 'protocolItems', 'handleProtocolItems') }} context={context} close={() => setContext('')}/>
	</Page>;
}

EditErrandPage.displayName = 'EditErrandPage';

export default EditErrandPage;
