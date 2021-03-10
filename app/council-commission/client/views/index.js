import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { ButtonGroup, Button, Field, Box, Label, Icon } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';

import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useRoute, useRouteParameter } from '../../../../client/contexts/RouterContext';
import VerticalBar from '../../../../client/components/basic/VerticalBar';
import { useEndpointDataExperimental } from '../../../../client/hooks/useEndpointDataExperimental';
import { GoBackButton } from '../../../utils/client/views/GoBackButton';
import { PersonsTable } from './PersonsTable';

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const useQueryPerson = ({ itemsPerPage, current }, [column, direction]) => useMemo(() => ({
	fields: JSON.stringify({ name: 1, organization: 1, position: 1, email: 1, surname: 1, group: 1, patronymic: 1, phone: 1 }),
	sort: JSON.stringify({ [column]: sortDir(direction), surnames: column === 'surname' ? sortDir(direction) : undefined }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
}), [itemsPerPage, current, column, direction]);

export function CouncilCommissionPage() {
    const t = useTranslation();
	const routeName = 'council-commission';

    const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['_id']);
	const [cache, setCache] = useState();
	const [persons, setPersons] = useState([]) ;

    const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);

	const queryPerson = useQueryPerson(debouncedParams, debouncedSort);

    const { data: personsData } = useEndpointDataExperimental('persons.list', queryPerson) || { };
	
	useEffect(() => {
		if (personsData && personsData.persons) {
			setPersons(personsData.persons);
		}
	}, [personsData]);

	const router = useRoute(routeName);

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const onEditClick = useCallback((_id) => () => {
		router.push({
			context: 'edit',
			id: _id,
		});
	}, [router]);

	return <Page flexDirection='row'>
		<Page>
			<Page.Header>
				<Field width={'100%'} display={'block'} marginBlock={'15px'}>
					<GoBackButton/>
					<Label fontScale='h1'>{t('Commission of the State Council of the Russian Federation in the direction of \"Transport\"')}</Label>
				</Field>
			</Page.Header>
			<Page.Content>
				<PersonsTable setParam={setParams} params={params}  personsData={persons} onEditClick={onEditClick} sort={sort}/>
			</Page.Content>
		</Page>
	</Page>;
}

CouncilCommissionPage.displayName = 'CouncilCommissionPage';

export default CouncilCommissionPage;