import React, { useCallback, useMemo, useState } from 'react';
import { Box, Button, ButtonGroup, Callout, Scrollable, Tile } from '@rocket.chat/fuselage';
import { css } from '@rocket.chat/css-in-js';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useFormatDate } from '../../../../client/hooks/useFormatDate';
import { ENDPOINT_STATES, useEndpointDataExperimental } from '../../../../client/hooks/useEndpointDataExperimental';
import { constructPersonFIO } from '../../../utils/client/methods/constructPersonFIO';
import { preProcessingProtocolItems } from './lib';

const clickable = css`
		cursor: pointer;

		&:hover, &:focus {
			background: #F7F8FA;
		}
	`;

export function ItemsChoose({ protocolId = '', setProtocolItems, protocolItems = [], setProtocolItemsId, close }) {
	const t = useTranslation();
	const formatDate = useFormatDate();

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });

	const protocolItemsState = useMemo(() => protocolItems, [protocolItems]);

	const { data: protocolData, state: protocolState } = useEndpointDataExperimental('protocols.getProtocolItemsByProtocolId', useMemo(() => ({
		query: JSON.stringify({ _id: protocolId, protocolItems: protocolItemsState }),
		fields: JSON.stringify({ expireAt: 1, num: 1 }),
	}), [protocolId, protocolItemsState]));

	const getLog = (protocolItem) => {
		return ['№', protocolItem.num, ', ', preProcessingProtocolItems(protocolItem.name)].join('');
	};

	const handleSave = useCallback((protocolItem) => {
		console.dir({ protocolItems, protocolItem });
		setProtocolItems && setProtocolItems([...protocolItems, { ...protocolItem, name: preProcessingProtocolItems(protocolItem.name) }]);
		setProtocolItemsId && setProtocolItemsId([protocolItem.id]);
		protocolData?.protocolItems?.filter((_protocolItem) => protocolItem._id === _protocolItem._id);
	}, [protocolData, protocolItems, setProtocolItems, setProtocolItemsId]);

	const ProtocolItem = (protocolItem) => <Box
		pb='x4'
		color='default'
		className={clickable}
		onClick={() => handleSave(protocolItem)}
		// title={t('Participant_Add')}
	>
		<Box fontSize='16px'>{getLog(protocolItem)}</Box>
	</Box>;

	const prop = useMemo(() => protocolData, [protocolData]);
	if ([protocolState].includes(ENDPOINT_STATES.LOADING)) {
		return <Callout m='x16'>{ t('Loading') }</Callout>;
	}

	console.log({ protocolData, prop });
	return <Box>
		{/*<SearchByText setParams={ setParams } usersData={data.persons} setUsersData={setFindUsers}/>*/}
		{!protocolData?.items
			? <>
				<Tile fontScale='p1' elevation='0' color='info' textAlign='center'>
					{t('No_data_found')}
				</Tile>
			</>
			: <>
				<Scrollable>
					<Box mb='x8' flexGrow={1}>
						{protocolData.items.length > 0
							? protocolData.items.map((props, index) => <ProtocolItem key={props._id || index} { ...props}/>)
							: <></>
						}
					</Box>
				</Scrollable>
				<ButtonGroup stretch w='full'>
					<Button mie='x4' onClick={close}>{t('Cancel')}</Button>
				</ButtonGroup>
			</>
		}
	</Box>;
}

export function SectionChoose({ sectionArray = [], setSection, close }) {
	const t = useTranslation();

	const getLog = (protocolItem) => {
		return ['№', protocolItem.num, preProcessingProtocolItems(protocolItem.name)].join(', ');
	};

	const handleSave = useCallback((section) => {
		setSection(section);
		close();
	}, [setSection, close]);

	const ProtocolItem = (section) => <Box
		pb='x4'
		color='default'
		className={clickable}
		onClick={() => handleSave(section)}
	>
		<Box fontSize='16px'>{getLog(section)}</Box>
	</Box>;

	return <Box>
		{!sectionArray
			? <>
				<Tile fontScale='p1' elevation='0' color='info' textAlign='center'>
					{t('No_data_found')}
				</Tile>
			</>
			: <>
				<Scrollable>
					<Box mb='x8' flexGrow={1}>
						{sectionArray.length > 0
							? sectionArray.map((props, index) => <ProtocolItem key={props._id || index} { ...props}/>)
							: <></>
						}
					</Box>
				</Scrollable>
				<ButtonGroup stretch w='full'>
					<Button mie='x4' onClick={close}>{t('Cancel')}</Button>
				</ButtonGroup>
			</>
		}
	</Box>;
}
