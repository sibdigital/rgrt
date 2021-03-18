import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { ButtonGroup, Button, Field, Box, Label, Icon } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMediaQuery } from '@rocket.chat/fuselage-hooks';

import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useRoute, useRouteParameter } from '../../../../client/contexts/RouterContext';
import VerticalBar from '../../../../client/components/basic/VerticalBar';
import { useEndpointDataExperimental } from '../../../../client/hooks/useEndpointDataExperimental';
import { GoBackButton } from '../../../utils/client/views/GoBackButton';
import { PersonsTable } from './PersonsTable';
import { useEndpointData } from '/client/hooks/useEndpointData';
import UserAvatar from '../../../../client/components/basic/avatar/UserAvatar';

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const useQueryPerson = ({ itemsPerPage, current }, [column, direction]) => useMemo(() => ({
	//query: JSON.stringify({ workingGroup: "Состав комиссии" }),
	fields: JSON.stringify({ name: 1, organization: 1, position: 1, email: 1, surname: 1, group: 1, patronymic: 1, phone: 1, username: 1, workingGroup: 1, avatar: 1 }),
	sort: JSON.stringify({ [column]: sortDir(direction), surnames: column === 'surname' ? sortDir(direction) : undefined }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
}), [itemsPerPage, current, column, direction]);

export function CouncilCommission() {
	const routeName = 'council-commission';

	const [persons, setPersons] = useState([]) ;
    const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['weight']);
	const debouncedParams = useDebouncedValue(params, 500);	
	const debouncedSort = useDebouncedValue(sort, 500);

	const queryPerson = useQueryPerson(debouncedParams, debouncedSort);

	const { data: personsData } = useEndpointDataExperimental('persons.list', queryPerson) || { };
	console.log(personsData)
	useEffect(() => {
		if (personsData && personsData.persons) {
			setPersons(personsData.persons);
			console.log(personsData);
		}
	}, [personsData]);

	return <CouncilCommissionPage persons={persons}/>
}

export function CouncilCommissionPage(
	persons
) {
    const t = useTranslation();

	const [cache, setCache] = useState();

	const mediaQuery = useMediaQuery('(min-width: 520px)');

	const RenderBox = (persons) => {
		const { _id, name, surname, patronymic, email, phone, organization, position, username, avatar} = persons;
		return  <Box display={'flex'} mb='x16' mi='x16' height='x320' maxWidth={'x500'} w='full'>
				<Box><img width='250px' height='320px' className='imgRerenderer' src={avatar.url}/></Box>
				<Box pi={'x16'} pb={'x24'} minWidth={'x250'} backgroundColor={'whitesmoke'}>
					<Box fontSize={'x24'}>{surname} {name}{"\n" + patronymic}</Box>
					<Box lineHeight={'x24'} fontSize={'x16'} mb='x12'>{position}</Box>
				</Box>
			</Box>;
	};

	return <Page flexDirection='row'>
		<Page>
			<Page.Header>
				<Field width={'100%'} display={'block'} marginBlock={'15px'}>
					<GoBackButton/>
					<Label fontScale={mediaQuery ? 'h1' : 'h2'}>{t('Commission of the State Council of the Russian Federation in the direction of \"Transport\"')}</Label>
				</Field>
			</Page.Header>
			<Page.ScrollableContent>
				<Box display={mediaQuery ? 'flex' : 'unset'} flexWrap={'wrap'} justifyContent={'flex-start'} maxWidth='x1800' w='full' alignSelf='center' pi='x32' pb='x24' fontSize='x16'>
					{persons 
						? persons.persons.map((props, person) => <RenderBox key={props._id || person} {...props}/>)
						: <Box/>}
				</Box>
				{/* <PersonsTable setParam={setParams} params={params}  personsData={persons} onEditClick={onEditClick} sort={sort}/> */}
			</Page.ScrollableContent>
		</Page>
	</Page>;
}

CouncilCommission.displayName = 'CouncilCommission';

export default CouncilCommission;