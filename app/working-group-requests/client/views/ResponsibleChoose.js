import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Field, Icon, TextInput } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { css } from '@rocket.chat/css-in-js';

import { constructPersonFullFIO } from '../../../utils/client/methods/constructPersonFIO';
import { GenericList } from '../../../../client/components/GenericList';
import { useEndpointDataExperimental } from '../../../../client/hooks/useEndpointDataExperimental';
import { useTranslation } from '../../../../client/contexts/TranslationContext';

const clickable = css`
		cursor: pointer;

		&:hover, &:focus {
			background: #F7F8FA;
		}
	`;

const FilterByText = ({ setFilter, ...props }) => {
	const t = useTranslation();
	const [text, setText] = useState('');

	const handleChange = useMutableCallback((event) => setText(event.currentTarget.value));
	const onSubmit = useMutableCallback((e) => e.preventDefault());

	useEffect(() => {
		setFilter({ text, offset: 0, current: 0 });
	}, [setFilter, text]);

	return <Box mb='x16' is='form' onSubmit={onSubmit} display='flex' flexDirection='column' {...props}>
		<Field.Label>{t('Search')}</Field.Label>
		<TextInput flexShrink={0} placeholder={t('Search')} addon={<Icon name='magnifier' size='x20'/>} onChange={handleChange} value={text} />
	</Box>;
};

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const useQuery = ({ text, itemsPerPage, current }, [column, direction], personFields, prevResponsiblesId) => useMemo(() => ({
	query: JSON.stringify({
		$or: [{
			surname: { $regex: text || '', $options: 'i' },
			name: { $regex: text || '', $options: 'i' },
			patronymic: { $regex: text || '', $options: 'i' },
			email: { $regex: text || '', $options: 'i' },
		}],
		// $and: [
		// 	{
		// 		_id: { $ne: { $in: { prevResponsiblesId } } },
		// 	},
		// 	{
		// 		$or: [{
		// 			surname: { $regex: text || '', $options: 'i' },
		// 			name: { $regex: text || '', $options: 'i' },
		// 			patronymic: { $regex: text || '', $options: 'i' },
		// 			email: { $regex: text || '', $options: 'i' },
		// 		}],
		// 	},
		// ],
	}),
	fields: JSON.stringify(personFields),
	sort: JSON.stringify({ [column]: sortDir(direction) }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
}), [text, prevResponsiblesId, personFields, column, direction, itemsPerPage, current]);

export function ResponsibleChoose({
	onSetResponsible,
	prevResponsiblesId = [],
	close,
	personFields = null,
}) {
	const [params, setParams] = useState({ current: 0, itemsPerPage: 25, text: '' });
	const [sort, setSort] = useState(['surname']);
	const [refProtocolsFields, setRefProtocolsFields] = useState(personFields ?? { surname: 1, name: 1, patronymic: 1, userId: 1 });
	const [refPrevResponsiblesId, setRefPrevResponsiblesId] = useState(prevResponsiblesId ?? []);
	const [loadedMore, setLoadedMore] = useState(false);

	const [personsList, setPersonsList] = useState([]);

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);

	const query = useQuery(debouncedParams, debouncedSort, refProtocolsFields, refPrevResponsiblesId);

	const { data: personData } = useEndpointDataExperimental('persons.list', query);

	useEffect(() => {
		if (personData && personData.persons) {
			console.dir({ personData, personsList, debouncedParams });
			if (debouncedParams.current > 0) {
				setPersonsList(personsList.concat(personData.persons));
			} else {
				setPersonsList(personData.persons);
			}
		}
	}, [personData]);
	useMemo(() => console.dir({ params }), [params]);

	const handleChoose = useCallback((responsible) => {
		onSetResponsible && onSetResponsible(responsible);
		close && close();
	}, [close, onSetResponsible]);

	const renderRow = (responsible) => {
		const label = constructPersonFullFIO(responsible);

		return <Box
			pb='x4'
			color='default'
			className={clickable}
			onClick={() => handleChoose(responsible)}
			fontSize='16px'
			mbe='x8'
			height='30px'
		>
			{responsible.index || responsible.index === 0 ? [responsible.index + 1, '. '].join('') : ''} {label}
		</Box>;
	};

	return <GenericList onLoadMore={() => setLoadedMore(true)} FilterComponent={FilterByText} layout={'column'} renderRow={renderRow} results={personsList} total={personData?.total ?? 0} setParams={setParams} params={params}/>;
}
