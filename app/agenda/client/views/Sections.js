import React from 'react';
import { Box, Icon } from '@rocket.chat/fuselage';
import { css } from '@rocket.chat/css-in-js';

const clickable = css`
		cursor: pointer;

		&:hover,
		&:focus {
			background: #F7F8FA;
		}
	`;

export function Sections({ data, onSectionMenuClick }) {
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

	const Section = (section) => <Box>
		<Box
			mis='x24'
			mbe='x16'
			color='default'
			display='flex'
			flexDirection='row'
			className={clickable}
		>
			<Box display='flex' flexDirection='row'>
				<Box mie='x4'>{section.label}</Box>
				<Box>{section.value}</Box>
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
							{...props}/>)
					: <></>
			)}
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
				<Box mie='x4' fontWeight='600'>{index + 1}: </Box>
			</Box>
			<Box
				pi='x4' mis='auto' style={{ cursor: 'pointer' }} data-section={section[0]._id} data-first={section.first}
				data-last={section.last} onClick={onSectionMenuClick}>
				<Icon name='menu' size='x20'/>
			</Box>
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
