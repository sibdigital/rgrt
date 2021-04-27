/* eslint-disable react-hooks/rules-of-hooks */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Box, Icon, Label, CheckBox, Accordion, Field, TextInput } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMediaQuery, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import _ from 'underscore';
import Switch from '@material-ui/core/Switch';

import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
// import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { ENDPOINT_STATES, useEndpointDataExperimental } from '../../../../client/hooks/useEndpointDataExperimental';
import { GoBackButton } from '../../../utils/client/views/GoBackButton';
import { useForm } from '../../../../client/hooks/useForm';
import { Materials } from './materials';
import AutoCompleteRegions from '../../../tags/client/views/AutoCompleteRegions';

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const getQuery = (params) => {
	let result = null;
	const orArr = [];
	if (params.isCouncils) {
		orArr.push({ councilId: { $exists: 1 } });
	}
	if (params.isErrands) {
		orArr.push({ errandId: { $exists: 1 } });
	}
	// if (params.isWorkingGroupRequests) {
	// 	orArr.push({ workingGroupRequestId: { $exists: 1 } });
	// }
	if (params.tags && _.isArray(params.tags) && params.tags.length > 0) {
		orArr.push({ 'tag._id': { $in: params.tags } });
	}
	if (params.name && params.name !== '') {
		orArr.push({ name: { $regex: params.name, $options: 'i' } });
	}
	if (orArr.length) {
		if (params.isOr) {
			result = { $or: orArr };
		} else {
			result = { $and: orArr };
		}
	}
	return result ?? {};
};

const useQuery = ({ isCouncils, isErrands, tags, name, isOr, itemsPerPage, current }, [column, direction], cache) => useMemo(() => ({
	query: JSON.stringify(getQuery({ isCouncils, isErrands, tags, name, isOr })),
	sort: JSON.stringify({ [column]: sortDir(direction) }),
	// fields: JSON.stringify({ d: 1, num: 1, name: 1, place: 1, council: 1 }),
	...cache && { cache },
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
	// TODO: remove cache. Is necessary for data invalidation
}), [isCouncils, isErrands, tags, name, isOr, column, direction, cache, itemsPerPage, current]);

function MaterialsPage() {
	const t = useTranslation();
	const mediaQuery = useMediaQuery('(min-width: 520px)');

	const [params, setParams] = useState({ isCouncils: false, isErrands: false, tags: [], name: '', isOr: false, current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['name', 'ts']);
	const [cache, setCache] = useState(new Date());
	const [isFetching, setIsFetching] = useState(false);

	const debouncedParams = useDebouncedValue(params, 1000);
	const debouncedSort = useDebouncedValue(sort, 1000);

	const query = useQuery(debouncedParams, debouncedSort, cache);

	const { data, state: filesState } = useEndpointDataExperimental('upload-files.list', query);

	const baseArray = useMemo(() => {
		const baseArr = [];
		if (data && data.files) {
			data.files.forEach((file) => {
				if (file.councilId) {
					baseArr.push({ _id: file.councilId, council: true });
				}
				if (file.workingGroupRequestId) {
					baseArr.push({ _id: file.workingGroupRequestId, workingGroupRequest: true });
				}
				if (file.errandId) {
					baseArr.push({ _id: file.errandId, errand: true });
				}
			});
		}
		return baseArr;
	}, [data]);

	const { data: workingGroupRequestData, state: workingGroupRequestState } = useEndpointDataExperimental('working-groups-requests.list', useMemo(() => ({
		query: JSON.stringify({ _id: { $in: baseArray.filter((file) => file.workingGroupRequest).map((file) => file._id) ?? [] } }),
		fields: JSON.stringify({ date: 1 }),
	}), [baseArray]));

	const { data: councilsData, state: councilsState } = useEndpointDataExperimental('councils.list', useMemo(() => ({
		query: JSON.stringify({ _id: { $in: baseArray.filter((file) => file.council).map((file) => file._id) ?? [] } }),
		fields: JSON.stringify({ d: 1 }),
	}), [baseArray]));

	const { data: errandsData, state: errandsState } = useEndpointDataExperimental('errands.list', useMemo(() => ({
		query: JSON.stringify({ _id: { $in: baseArray.filter((file) => file.errand).map((file) => file._id) ?? [] } }),
		fields: JSON.stringify({ expireAt: 1 }),
	}), [baseArray]));

	useEffect(() => {
		if (![filesState, workingGroupRequestState, councilsState, errandsState].includes(ENDPOINT_STATES.LOADING)) {
			setIsFetching(false);
		}
	}, [filesState, workingGroupRequestState, councilsState, errandsState]);

	const onChange = useCallback(() => {
		setCache(new Date());
	}, []);

	const onClick = useCallback((_id) => () => {

		console.dir({ _id });
	}, []);

	const onHeaderClick = useCallback((id) => () => {
		const [sortBy, sortDirection] = sort;

		if (sortBy === id) {
			setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
			return;
		}
		setSort([id, 'asc']);
	}, [sort]);

	const handleChangeCurrent = useCallback((current) => {
		console.dir({ valueInHandleChangeParams: current, paramsInHandleChangeParams: params });
		setIsFetching(true);
		setParams({ ...params, current });
	}, [params]);

	// useMemo(() => console.dir({ paramsInIndex: params }), [params]);
	return <Page>
		<Page.Header title=''>
			<Box display='block' marginBlock='15px'>
				<GoBackButton/>
				<Label fontScale='h1'>{t('Materials')}</Label>
			</Box>
		</Page.Header>
		<Page.ScrollableContent>
			<Box key='filters'>
				<Filters setParams={setParams} params={params} setIsFetching={setIsFetching}/>
			</Box>
			<Box opacity={isFetching && '20%'} disabled={isFetching} width='98%'>
				{
					useMemo(() =>
						<Materials handleChangeCurrent={handleChangeCurrent} baseArray={{ councils: councilsData?.councils ?? [], workingGroupRequests: workingGroupRequestData?.requests ?? [], errands: errandsData?.errands ?? [] }} onChange={onChange} data={data} params={params} setParams={setParams} mediaQuery={mediaQuery} onClick={onClick} sort={sort} onHeaderClick={onHeaderClick}/>
					, [handleChangeCurrent, councilsData, data, errandsData, mediaQuery, onChange, onClick, onHeaderClick, params, sort, workingGroupRequestData])
				}
			</Box>
		</Page.ScrollableContent>
	</Page>;
}

MaterialsPage.displayName = 'MaterialsPage';

export default MaterialsPage;

const FilterByText = ({ setFilter, params, setIsFetching, ...props }) => {
	const t = useTranslation();
	const [text, setText] = useState('');

	const handleChange = useMutableCallback((event) => {
		setText(event.currentTarget.value);
		setFilter({ ...params, name: event.currentTarget.value });
		setIsFetching(true);
	});

	const onSubmit = useMutableCallback((e) => e.preventDefault());

	return <Box mb='x16' onSubmit={onSubmit} display='flex' flexDirection='row' {...props}>
		<Field.Label maxWidth='max-content' mie='x8' alignSelf='center'>{t('Files_Name_Search')}</Field.Label>
		<TextInput flexShrink={0} placeholder={t('Files_Name_Search')} addon={<Icon name='magnifier' size='x20'/>} onChange={handleChange} value={text} />
	</Box>;
};

function Filters({ setParams, setIsFetching, params }) {
	const t = useTranslation();
	const { values, handlers } = useForm({
		isCouncils: params?.isCouncils ?? false,
		isErrands: params?.isErrands ?? false,
		tags: params?.tags ?? [],
		isOr: params?.isOr ?? false,
	});

	const {
		isCouncils,
		isErrands,
		tags,
		isOr,
	} = values;

	const {
		handleIsCouncils,
		handleIsErrands,
		handleTags,
		handleIsOr,
	} = handlers;

	const handleChange = useCallback((value, handler, field) => {
		setIsFetching(true);
		if (field !== 'tags') {
			setParams({ ...params, current: 0, [field]: value });
		} else if (field === 'tags') {
			console.dir({ value, field, forQuery: value.map((val) => val._id) });
			setParams({ ...params, current: 0, [field]: value.map((val) => val._id) });
		}
		handler(value);
	}, [params, setIsFetching, setParams]);

	return <Accordion>
		<Accordion.Item title={t('Filters')}>
			<Box display='flex' flexDirection='row'>
				<Box display='flex' flexDirection='column' width='55%' mie='x16'>
					<AutoCompleteRegions isMultiple={true} onSetTags={(val) => handleChange(val, handleTags, 'tags')} prevTags={tags}/>
					<FilterByText setFilter={setParams} setIsFetching={setIsFetching}/>
				</Box>
				<Box display='flex' flexDirection='column' width='45%'>
					<Box margin='x8'>
						<Field.Label >{t('Filters_Search_All')}</Field.Label>
						<Switch color='primary' checked={isOr} onChange={() => handleChange(!isOr, handleIsOr, 'isOr')} name='arr or or'/>
						<Field.Label >{t('Filters_Search_Every')}</Field.Label>
					</Box>
					<Box margin='x8'>
						<CheckBox checked={isCouncils} onChange={() => handleChange(!isCouncils, handleIsCouncils, 'isCouncils')} mie='x8' />
						<Field.Label >{t('Files_In_Councils')}</Field.Label>
					</Box>
					<Box margin='x8'>
						<CheckBox checked={isErrands} onChange={() => handleChange(!isErrands, handleIsErrands, 'isErrands')} mie='x8' />
						<Field.Label >{t('Files_In_Errands')}</Field.Label>
					</Box>
				</Box>
			</Box>
		</Accordion.Item>
	</Accordion>;
}
