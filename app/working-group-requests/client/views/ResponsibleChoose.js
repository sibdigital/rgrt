import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';

import { constructPersonFullFIO } from '../../../utils/client/methods/constructPersonFIO';
import { GenericList } from '../../../../client/components/GenericList';
import { useEndpointDataExperimental } from '../../../../client/hooks/useEndpointDataExperimental';
import { css } from '@rocket.chat/css-in-js';

const clickable = css`
		cursor: pointer;

		&:hover, &:focus {
			background: #F7F8FA;
		}
	`;

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const useQuery = ({ itemsPerPage, current }, [column, direction], personFields, prevResponsiblesId) => useMemo(() => ({
	query: JSON.stringify({ _id: { $ne: { $in: { prevResponsiblesId } } } }),
	fields: JSON.stringify(personFields),
	sort: JSON.stringify({ [column]: sortDir(direction) }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
}), [prevResponsiblesId, personFields, column, direction, itemsPerPage, current]);

export function ResponsibleChoose({
	onSetResponsible,
	prevResponsiblesId = [],
	close,
	personFields = null,
}) {
	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['surname']);
	const [refProtocolsFields, setRefProtocolsFields] = useState(personFields ?? { surname: 1, name: 1, patronymic: 1, userId: 1 });
	const [refPrevResponsiblesId, setRefPrevResponsiblesId] = useState(prevResponsiblesId ?? []);

	const [personsList, setPersonsList] = useState([]);

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);

	const query = useQuery(debouncedParams, debouncedSort, refProtocolsFields, refPrevResponsiblesId);

	const { data: personData } = useEndpointDataExperimental('persons.list', query);

	useEffect(() => {
		if (personData && personData.persons) {
			console.dir({ personData, personsList });
			setPersonsList(personsList.concat(personData.persons));
		}
	}, [personData]);

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

	return <GenericList layout={'column'} renderRow={renderRow} results={personsList} total={personData?.total ?? 0} setParams={setParams} params={params}/>;
}
