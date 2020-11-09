import React from 'react';
import {Box, Button, Scrollable, Tile} from '@rocket.chat/fuselage';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useFormatDate } from '../../../../client/hooks/useFormatDate';

export function Sections({ data, onSectionClick, onAddItemClick, onItemClick }) {
	const t = useTranslation();
	const formatDate = useFormatDate();

	const Item = (item) => <>
		<Box mis='x24'
			 mbe='x4'
			 style={{cursor: 'pointer'}}
			 onClick={onItemClick(item.sectionId, item._id)}
			 display='flex'
			 flexDirection='row'
		>
			<Box is='span' pie='x8'>{item.num}.</Box>
			<Box>
				<Box mbe='x4' dangerouslySetInnerHTML={{ __html: item.name }} align='justify'/>
				{ item.responsible && <Box mbe='x4'>{t('Item_Responsible')}: {item.responsible}</Box> }
				{ item.expireAt && <Box mbe='x4'>{t('Item_ExpireAt')}: {formatDate(item.expireAt)}</Box> }
			</Box>
		</Box>
	</>;

	const Section = (section) => <Box>
		<Box
			mbe='x8'
			color='default'
			style={{cursor: 'pointer'}}
			onClick={onSectionClick(section._id)}
			display='flex'
			flexDirection='row'
		>
			<Box is='span' pie='x8'>{section.num}.</Box>
			<Box is='span' dangerouslySetInnerHTML={{ __html: section.name }} align='justify'/>
		</Box>
		<Box mbe='x8'>
			{(
				section.items
					? section.items.map((props, index) => <Item key={props._id || index} sectionId={section._id} { ...props }/>)
					: <></>
			)}
		</Box>
		<Button mi='x24' mbe='x8' small onClick={onAddItemClick('new-item', section._id)} aria-label={t('New')}>
			{t('Item_Add')}
		</Button>
	</Box>;

	return <>
		{data && !data.length
			? <></>
			: <>
				<Box mbe='x8'>
					{(
						data
							? data.map((props, index) => <Section key={props._id || index} { ...props}/>)
							: <></>
					)}
				</Box>
			</>
		}
	</>;
}
