import React from 'react';
import { Box, Icon } from '@rocket.chat/fuselage';
import { css } from '@rocket.chat/css-in-js';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useFormatDate } from '../../../../client/hooks/useFormatDate';
import { constructPersonFIO } from '../../../utils/client/methods/constructPersonFIO';

const clickable = css`
		cursor: pointer;
		// border-bottom: 2px solid #F2F3F5 !important;

		&:hover,
		&:focus {
			background: #F7F8FA;
		}
	`;

const constructResponsible = (item) => {
	const responsibleArr = item.responsible.map((person) => _.last(item.responsible) !== person ? constructPersonFIO(person) + ', ' : constructPersonFIO(person));
	return responsibleArr;
};

export function Sections({ data, onSectionMenuClick, onItemMenuClick }) {
	const t = useTranslation();
	const formatDate = useFormatDate();

	const getStatusIcon = (statusState) => {
		let color = 'transparent';
		switch (statusState) {
			case 1:
				color = 'red';
				break;
			case 2:
				color = 'yellow';
				break;
			case 3:
				color = 'green';
				break;
			default:
				break;
		}
		return color;
	};

	const Item = (item) => <>
		<Box
			mis='x24'
			mbe='x4'
			display='flex'
			flexDirection='row'
			className={clickable}>
			<Box display='flex' flexDirection='row' is='span' pie='x8'>
				<Box mie='x4' color={getStatusIcon(item.responsible.length > 0 ? item.status?.state ?? -1 : -1)}><Icon name='circle'/></Box>
				<Box>{item.sectionNum ? [item.sectionNum, '.'].join('') : ''}{item.num}.</Box>
			</Box>
			<Box flexGrow={1}>
				<Box mbe='x4' dangerouslySetInnerHTML={{ __html: item.name }} align='justify'/>
				{ item.responsible.length !== 0 && <Box mbe='x4'>{t('Item_Responsible')}: {constructResponsible(item)}</Box> }
				{ item.expireAt && <Box mbe='x4'>{t('Item_ExpireAt')}: {formatDate(item.expireAt)}</Box> }
			</Box>
			<Box pi='x4' style={{ cursor: 'pointer' }} data-item={item._id} data-section={item.sectionId}
				data-first={item.first}
				data-last={item.last} onClick={onItemMenuClick}>
				<Icon name='menu'/>
			</Box>
		</Box>
	</>;

	const Section = (section) => <Box>
		<Box
			mbe='x8'
			color='default'
			display='flex'
			flexDirection='row'
			className={clickable}
		>
			<Box is='span' pie='x8'>{section.num}.</Box>
			<Box flexGrow={1}>
				<Box mbe='x4' dangerouslySetInnerHTML={{ __html: section.name }} align='justify'/>
				{ section.speakers && <Box mbe='x4'>{t('Protocol_section_speakers')}: {section.speakers}</Box>}
			</Box>
			<Box pi='x4' style={{ cursor: 'pointer' }} data-section={section._id} data-first={section.first}
				data-last={section.last} onClick={onSectionMenuClick}>
				<Icon name='menu'/>
			</Box>
		</Box>
		<Box mbe='x8'>
			{(
				section.items
					? section.items.map((props, index) =>
						<Item
							key={props._id || index}
							first={index === 0}
							last={index === section.items.length - 1}
							sectionId={section._id}
							sectionNum={section.num}
							{...props}/>)
					: <></>
			)}
		</Box>
	</Box>;

	return <>
		{data && !data.length
			? <></>
			: <>
				<Box mbe='x8'>
					{(
						data
							? data.map((props, index) =>
								<Section
									key={props._id || index}
									first={index === 0}
									last={index === data.length - 1}
									{...props}/>)
							: <></>
					)}
				</Box>
			</>
		}
	</>;
}
