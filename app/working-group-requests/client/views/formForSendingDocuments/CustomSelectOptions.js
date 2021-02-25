import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Field, Label, Options, PositionAnimated, useCursor } from '@rocket.chat/fuselage';
import ReactTooltip from 'react-tooltip';

import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { preProcessingProtocolItems } from '../lib';

export function CustomSelectOptions({
	items,
	defaultSelectedLabel = '',
	onChange = () => {},
	active = false,
	showLabelTooltip = true,
	...props
}) {
	const t = useTranslation();
	const replaceChar = (str) =>
		[...str]?.map((ch) => ch).join('') || '';

	const [sectionItem, setSectionItem] = useState(-1);
	const [selectedItemTooltipLabel, setSelectedItemTooltipLabel] = useState('');
	const [selectedItemLabel, setSelectedItemLabel] = useState(defaultSelectedLabel);
	const [isSelected, setIsSelected] = useState(false);
	const defaultLabelLength = 45;

	useMemo(() => selectedItemLabel === defaultSelectedLabel ? setSectionItem(-1) : '', [selectedItemLabel, defaultSelectedLabel]);

	const constructShortLabel = (label) => {
		if (label.length <= defaultLabelLength) {
			return label;
		}
		return [label.slice(0, defaultLabelLength), '...'].join('');
	};

	const options = useMemo(() => {
		try {
			const renderOption = (label) => {
				const tooltipLabel = preProcessingProtocolItems(replaceChar(label));
				const mainLabel = preProcessingProtocolItems(constructShortLabel(label)) || '';
				return <Box
					display='flex' flexDirection='row' alignItems='center'
					data-for='itemT'
					data-tip={ tooltipLabel } style={{ whiteSpace: 'normal' }} width='-moz-available'>
					<Label>{ mainLabel }</Label>
					<ReactTooltip id='itemT' className='react-tooltip-class' multiline effect='solid' place='top'/>
				</Box>;
			};

			return items?.map((item) => [item[0] ?? -1, renderOption(item[1] ?? '')]) || [];
		} catch (e) {
			console.log(e);
			return [];
		}
	}, [t, items]);

	const [cursor, handleKeyDown, handleKeyUp, reset, [visible, hide, show]] = useCursor(-1, options, ([selected], [, hide]) => {
		setSectionItem(selected);
		reset();
		hide();
	});

	const ref = useRef();
	const onClick = useCallback(() => {
		ref.current.focus() & show();
		ref.current.classList.add('focus-visible');
	}, [show]);

	const handleSelection = useCallback(([selected]) => {
		console.log('HANDLE SELECT CUSTOM SELECT ' + defaultSelectedLabel);
		setSectionItem(selected);
		setIsSelected(true);
		reset();
		hide();
	}, [hide, reset]);

	useEffect(() => {
		console.log('USEEFFECT CUSTOM SELECT ' + defaultSelectedLabel);
		console.log(items);
		console.log(sectionItem);
		console.log(active);
		if (items.length === 0) {
			setSectionItem(-1);
		}
		if (items.length > 0 && sectionItem > -1) {
			if (!isSelected) {
				setSectionItem(-1);
			} else {
				onChange(sectionItem);
			}
			const label = constructShortLabel(items[sectionItem][1] ?? '');
			setSelectedItemTooltipLabel(label);
			setSelectedItemLabel(label);
			setIsSelected(false);
		}
		if (!active) {
			setSelectedItemLabel(defaultSelectedLabel);
			setSelectedItemTooltipLabel('');
		}
	}, [items, sectionItem, setSelectedItemLabel, setSelectedItemTooltipLabel, active, isSelected]);

	return (
		<>
			<Button
				{...props}
				width='-moz-available'
				height='40px'
				maxHeight='40px'
				ref={ref}
				ghost
				textAlign='left'
				alignItems='center'
				onClick={onClick}
				onBlur={hide}
				onKeyUp={handleKeyUp}
				onKeyDown={handleKeyDown}
				fontScale='p1'
				borderWidth='0.125rem'
				borderColor='var(--rcx-input-colors-border-color, var(--rcx-color-neutral-500, #cbced1))'
				data-for='requestSelectTooltip'
				data-tip={ selectedItemTooltipLabel } style={{ whiteSpace: 'normal' }}
			>
				<ReactTooltip id='requestSelectTooltip' className='react-tooltip-class' multiline effect='solid' place='top' disable={!showLabelTooltip}/>
				<Field display='flex' flexDirection='row'>
					<Label
						width='90%'
						color={ selectedItemLabel === defaultSelectedLabel ? '#9ea2a8' : ''}
						fontScale='p1'
						fontWeight={ selectedItemLabel === defaultSelectedLabel ? '400' : '500'}
					>
						{selectedItemLabel}
					</Label>
					<Box color='var(--rc-color-primary-dark)' borderColor='transparent' fontFamily='RocketChat' fontSize='1.25rem' mis='auto'></Box>
				</Field>
			</Button>
			<PositionAnimated
				width='-moz-available'
				visible={visible}
				anchor={ref}
				placement={'bottom-end'}
				maxWidth='450px'
			>
				<Options
					width='-moz-available'
					maxWidth='450px'
					onSelect={handleSelection}
					options={options}
					cursor={cursor}/>
			</PositionAnimated>
		</>
	);
}
