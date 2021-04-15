import React, { useMemo } from 'react';
import {
	Box,
	Callout,
	Skeleton,
} from '@rocket.chat/fuselage';
import { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';

import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { useRouteParameter } from '../../../../../client/contexts/RouterContext';
import { ENDPOINT_STATES, useEndpointDataExperimental } from '../../../../../client/hooks/useEndpointDataExperimental';
import { useUserId } from '../../../../../client/contexts/UserContext';
import { preProcessingProtocolItems } from '../../../../working-group-requests/client/views/lib';
import { ErrandTypes } from '../../utils/ErrandTypes';
import { ErrandStatuses } from '../../utils/ErrandStatuses';
import { NewErrand } from './EditErrand';

registerLocale('ru', ru);
require('react-datepicker/dist/react-datepicker.css');

export function AddErrandByProtocolItemPage() {
	const t = useTranslation();
	const userId = useUserId();

	const itemId = useRouteParameter('itemId');

	const { data: _protocolData, state, error } = useEndpointDataExperimental('protocols.findByItemId', useMemo(() => ({ query: JSON.stringify({ _id: itemId }) }), [itemId]));
	const { data: personData, state: personState } = useEndpointDataExperimental('users.getPerson', useMemo(() => ({ query: JSON.stringify({ userId }) }), [userId]));

	if ([state, personState].includes(ENDPOINT_STATES.LOADING)) {
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
	const protocolData = _protocolData.protocol[0];

	const section = protocolData.sections.filter((section) => section.items.find((item) => item._id === itemId))[0];
	const item = section.items.find(item => item._id === itemId);
	const itemResponsible = item?.responsible[0];
	const itemName = item.name ? preProcessingProtocolItems(item.name) : '';

	const errand = {
		initiatedBy: {
			_id: personData._id,
			surname: personData.surname,
			name: personData.name,
			patronymic: personData.patronymic,
		},
		status: ErrandStatuses.OPENED,
		chargedTo: {
			userId,
			person: {
				_id: itemResponsible._id,
				surname: itemResponsible.surname,
				name: itemResponsible.name,
				patronymic: itemResponsible.patronymic,
			},
		},
		desc: $(item?.name).text(),
		expireAt: new Date(),
		ts: new Date(),
		protocol: {
			_id: protocolData._id,
			num: protocolData.num,
			d: protocolData.d,
			sectionId: section._id,
			itemId: item._id,
			itemName,
			itemNum: item.num ?? '',
		},
		errandType: ErrandTypes.byProtocolItem,
		protocolItemId: itemId,
	};
	// console.log({ errand, item, itemText: $(item.name).text(), itemName });

	return <NewErrand errand={errand} request={null}/>;
}

AddErrandByProtocolItemPage.displayName = 'AddErrandByProtocolItemPage';

export default AddErrandByProtocolItemPage;
