import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { ButtonGroup, Button, Field, Box, Label, Icon } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMediaQuery } from '@rocket.chat/fuselage-hooks';

import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useRoute, useRouteParameter } from '../../../../client/contexts/RouterContext';
import VerticalBar from '../../../../client/components/basic/VerticalBar';
import { useEndpointDataExperimental } from '../../../../client/hooks/useEndpointDataExperimental';
import { GoBackButton } from '../../../utils/client/views/GoBackButton';
import { useEndpointData } from '/client/hooks/useEndpointData';

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const useQueryPerson = ({ itemsPerPage, current }, [column, direction]) => useMemo(() => ({
	query: JSON.stringify({ 'group.title': 'Состав комиссии' }),
	fields: JSON.stringify({ name: 1, organization: 1, position: 1, email: 1, surname: 1, group: 1, patronymic: 1, phone: 1, username: 1, avatarSource: 1 }),
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

	useEffect(() => {
		if (personsData && personsData.persons) {
			setPersons(personsData.persons);
		}
	}, [personsData]);

	return <CouncilCommissionPage persons={persons}/>
}

export function CouncilCommissionPage(
	persons
) {
    const t = useTranslation();

	const [cache, setCache] = useState();

	const mediaQuery = useMediaQuery('(min-width: 559px)');

	const RenderBox = ({person, index}) => {
		const { _id, name, surname, patronymic, email, phone, organization, position, username, avatarSource} = person;

		if (index === 0) {
			return <Box className={`commission-person-block--${index}`} position='relative'>
			<img width='100%' height='100%' className='imgRerenderer' src={avatarSource?.url}/>
			<Box className='imgSide-bg gradient' w='100%' >
				<Box className='imgSide-inf'>
					<Box fontSize={mediaQuery ? 'x32' : 'x24'}>
						<Box>{surname}</Box>
						<Box>{name} {patronymic}</Box>
					</Box>
					<Box fontSize={mediaQuery ? 'x18' : 'x16'} mbs='x16' lineHeight={mediaQuery ? 'x24' : 'x18'}>
						<Box>{position}</Box>
						<Box>{organization}</Box>
					</Box>
					<Box fontSize={mediaQuery ? 'x18' : 'x16'} mbs='x12' lineHeight={mediaQuery ? 'x24' : 'x18'}>
						<Box>{phone}</Box>
						<Box style={{wordBreak:'break-word'}}>{email}</Box>
					</Box>
				</Box>
			</Box>
		</Box>;
		}
		return  <Box className={`commission-person-block`} display='flex'>
			<Box flexBasis='40%'><img width='100%' height='100%' className='imgRerenderer' src={avatarSource?.url}/></Box>
			<Box className='right-elem'>
				<Box className='fio'>
					<Box>{surname} {name}</Box>
					<Box>{patronymic}</Box>
				</Box>
				<Box className='pos-org'>
					<Box>{position}</Box>
					<Box>{organization}</Box>
				</Box>
				<Box className='contact-info'>
					<Box>{phone}</Box>
					<Box>{email}</Box>
				</Box>
			</Box>
		</Box>;
	};

	return <Page flexDirection='row'>
		<Page>
			<Page.Header display={mediaQuery ? 'flex' : 'block'}>
				<Field width={'100%'} display={'block'} marginBlockStart={'15px'}>
					<GoBackButton/>
					<Label fontScale='h1'>{t('Commission of the State Council of the Russian Federation in the direction of \"Transport\"')}</Label>
				</Field>
			</Page.Header>
			<Page.ScrollableContent>
				<Box className={'council-commission-grid'}>
				{/* display={mediaQuery ? 'flex' : 'unset'} flexWrap={'wrap'} justifyContent={'flex-start'} maxWidth='x1800' w='full' alignSelf='center' fontSize='x16' */}
					{persons 
						? persons.persons.map((person, index) => 
						<RenderBox 
						key={person._id || index} 
						person={person}
						index={index}
						/>)
						: <Box/>}
				</Box>
				{/* <PersonsTable setParam={setParams} params={params}  personsData={persons} onEditClick={onEditClick} sort={sort}/> */}
			</Page.ScrollableContent>
		</Page>
	</Page>;
}

CouncilCommission.displayName = 'CouncilCommission';

export default CouncilCommission;