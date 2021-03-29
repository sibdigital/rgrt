import { Box, Button, Skeleton, Table, Flex, Tile, Scrollable } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { useMemo, useState, useEffect, useCallback, forwardRef } from 'react';

import { useTranslation } from '../contexts/TranslationContext';

function SortIcon({ direction }) {
	return <Box is='svg' width='x24' height='x24' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'>
		<path d='M5.33337 5.99999L8.00004 3.33333L10.6667 5.99999' stroke={direction === 'desc' ? '#9EA2A8' : '#E4E7EA' } strokeWidth='1.33333' strokeLinecap='round' strokeLinejoin='round'/>
		<path d='M5.33337 10L8.00004 12.6667L10.6667 10' stroke={ direction === 'asc' ? '#9EA2A8' : '#E4E7EA'} strokeWidth='1.33333' strokeLinecap='round' strokeLinejoin='round'/>
	</Box>;
}

export function Th({ children, active, direction, sort, onClick, align, ...props }) {
	const fn = useMemo(() => () => onClick && onClick(sort), [sort, onClick]);
	return <Table.Cell clickable={!!sort} onClick={fn} { ...props }>
		<Box display='flex' alignItems='center' wrap='no-wrap'>{children}{sort && <SortIcon direction={active && direction} />}</Box>
	</Table.Cell>;
}

const LoadingRow = () => <Box display='flex'>
	<Flex.Item>
		<Skeleton variant='rect' height={40} width={40} />
	</Flex.Item>
	<Box mi='x8' flexGrow={1}>
		<Skeleton width='100%' />
		<Skeleton width='100%' />
	</Box>
</Box>;

const Pagination = ({
	current,
	itemsPerPage,
	count,
	onSetCurrent,
}) => {
	const t = useTranslation();

	return <Box display='flex' flexDirection='row'>
		{current !== count && <Button width='100%' onClick={() => onSetCurrent(current + itemsPerPage)}>
			{t('Load_more')}
		</Button>}
	</Box>;
};

export const GenericList = forwardRef(function GenericTable({
	children,
	results,
	total,
	renderRow: RenderRow,
	setParams = () => { },
	params: paramsDefault = '',
	FilterComponent = () => null,
	layout = 'row',
	...props
}, ref) {
	const t = useTranslation();

	const [filter, setFilter] = useState(paramsDefault);

	const [itemsPerPage, setItemsPerPage] = useState(paramsDefault?.itemsPerPage ?? 50);
	// const [itemsPerPage, setItemsPerPage] = useState(5);

	const [current, setCurrent] = useState(0);

	const params = useDebouncedValue(filter, 500);

	useMemo(() => console.log({ paramsDefault }), [itemsPerPage]);

	useEffect(() => {
		setParams({ ...params, current, itemsPerPage });
	}, [params, current, itemsPerPage, setParams]);

	const Loading = useCallback(() => Array.from({ length: 10 }, (_, i) => <LoadingRow key={i} />), []);

	return <>
		<FilterComponent setFilter={setFilter} { ...props}/>
		{results && !results.length
			? <Tile fontScale='p1' elevation='0' color='info' textAlign='center'>
				{t('No_data_found')}
			</Tile>
			: <>
				<Scrollable>
					<Box mi='neg-x24' pi='x24' flexGrow={1} ref={ref} display='flex' flexDirection={layout}>
						{RenderRow && (
							results
								? results.map((props, index) => <RenderRow key={props._id || index} index={index} { ...props }/>)
								: <Loading/>
						)}
						{results && results.length < total && <Pagination
							current={current}
							itemsPerPage={itemsPerPage}
							count={total || 0}
							onSetCurrent={setCurrent}
						/>}
					</Box>
				</Scrollable>
			</>
		}
	</>;
});

export default GenericList;
