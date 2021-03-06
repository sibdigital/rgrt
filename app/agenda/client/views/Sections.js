import React from 'react';
import { Box, Icon } from '@rocket.chat/fuselage';
import { css } from '@rocket.chat/css-in-js';

import { useTranslation } from '../../../../client/contexts/TranslationContext';

const clickable = css`
		cursor: pointer;

		&:hover,
		&:focus {
			background: #F7F8FA;
		}
	`;

export function Sections({ data, onSectionMenuClick, isAllowEdit }) {
	const t = useTranslation();

	const Item = (item) => <>
		<Box
			mis='x40'
			mbe='x4'
			display='flex'
			flexDirection='row'
			className={clickable}>
			<Box>{item.value}</Box>
		</Box>
	</>;

	const constructPerson = (arr) => {
		let result = '';
		// eslint-disable-next-line no-return-assign
		arr?.forEach((item) => result += [item.value, ', '].join(''));
		if (arr?.length > 0) {
			result = result.slice(0, -2);
		}
		return result;
	};

	const Section = (section) => <Box>
		<Box mbe='x8'>
			<Box
				mis='x24'
				mbe='x16'
				color='default'
				display='flex'
				flexDirection='row'
				className={clickable}
			>
				<Box display='flex' flexDirection={ section.renderDirection ?? 'row' }>
					{!section.isHiddenLabel && <Box mie='x4'>{section.label}</Box>}
					<Box mbs={section.renderDirection && 'x8'} mis={section.renderDirection && 'x16'}>{section.value}</Box>
					{ section.items?.length !== 0 && <Box mbe='x4'>{constructPerson(section.items)}</Box> }
				</Box>
			</Box>
			{/*{(*/}
			{/*	section.items*/}
			{/*		? section.items.map((props, index) =>*/}
			{/*			<Item*/}
			{/*				key={props._id || index}*/}
			{/*				first={index === 0}*/}
			{/*				last={index === section.items.length - 1}*/}
			{/*				sectionId={section._id}*/}
			{/*				{...props}/>)*/}
			{/*		: <></>*/}
			{/*)}*/}
		</Box>
	</Box>;
	const SectionHeader = ({ section, index }) => <Box>
		<Box
			mbe='x8'
			color='default'
			display='flex'
			flexDirection='row'
			className={clickable}
		>
			<Box display='flex' flexDirection='row'>
				<Box mie='x9' fontWeight='600'>{section[1]?.item ? section[1].value : index + 1}.</Box>
				<Box>{t('Agenda_issue_consideration')}</Box>
			</Box>
			{isAllowEdit && <Box
				pi='x4' mis='auto' style={{ cursor: 'pointer' }} data-section={section[0]._id} data-index-number={index} data-first={section.first}
				data-last={section.last} onClick={onSectionMenuClick}>
				<Icon name='menu' size='x20'/>
			</Box>}
		</Box>
		<Box mbe='x8'>
			{(
				section
					? section?.map((props, propsIndex) =>
						!props.hidden && <Section
							key={props._id || propsIndex}
							first={propsIndex === 0}
							last={propsIndex === section.length - 1}
							sectionId={section._id}
							{...props}/>)
					: <></>
			)}
		</Box>
	</Box>;

	return <>
		{!data
			? <></>
			: <>
				<Box mbe='x8'>
					{(
						data
							? data.sections?.map((section, index) =>
								<SectionHeader
									key={section._id || index}
									first={index === 0}
									last={index === data.sections.length - 1}
									section={section}
									index={index}/>)
							: <></>
					)}
				</Box>
			</>
		}
	</>;
}
