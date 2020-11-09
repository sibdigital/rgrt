import React from 'react';
import {Box, Button, Scrollable, Tile} from '@rocket.chat/fuselage';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useFormatDate } from '../../../../client/hooks/useFormatDate';

export function Sections({ data, onSectionClick, onAddItemClick, onItemClick }) {
	const t = useTranslation();
	const formatDate = useFormatDate();

	const Item = (item) => <>
		<Box mbe='x4' onClick={onItemClick(item.sectionId, item._id)}>
			<Box mbe='x4'>{item.num}. {item.name}</Box>
			{ item.responsible && <Box mbe='x4' pis='x16'>{t('Item_Responsible')}: {item.responsible}</Box> }
			{ item.expireAt && <Box mbe='x4' pis='x16'>{t('Item_ExpireAt')}: {formatDate(item.expireAt)}</Box> }
		</Box>
	</>;

	const Section = (section) => <>
		<Box
			mi='x24'
			mbe='x8'
			color='default'
			onClick={onSectionClick(section._id)}
		>
			{section.num}. {section.name}
		</Box>
		<Box mb='x16' mi='neg-x24' pi='x24'>
			{(
				section.items
					? section.items.map((props, index) => <Item key={props._id || index} sectionId={section._id} { ...props }/>)
					: <></>
			)}
		</Box>
		<Button mbe='x8' small onClick={onAddItemClick('new-item', section._id)} aria-label={t('New')}>
			{t('Item_Add')}
		</Button>
	</>;

	return <>
		{data && !data.length
			? <Tile fontScale='p1' elevation='0' color='info' textAlign='center'>
				{t('No_data_found')}
			</Tile>
			: <>
				<Scrollable>
					<Box mb='x16' mi='neg-x24' pi='x24'>
						{(
							data
								? data.map((props, index) => <Section key={props._id || index} { ...props}/>)
								: <></>
						)}
					</Box>
				</Scrollable>
			</>
		}
	</>;
}
