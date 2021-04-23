import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { isIOS } from 'react-device-detect';
import { Box, Button, Field } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { Autocomplete, createFilterOptions } from '@material-ui/lab';
import Chip from '@material-ui/core/Chip';
import TextField from '@material-ui/core/TextField';
import _ from 'underscore';

import { constructPersonFIO } from '../../../utils/client/methods/constructPersonFIO';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { useSetModal } from '../../../../client/contexts/ModalContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import NewPersonModal from './NewPersonModal';

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const useQuery = ({ text, itemsPerPage, current }, [column, direction], prevResponsibleIds) => useMemo(() => ({
	query: JSON.stringify({
		$and: [{
			$or: [{
				surname: { $regex: text || '', $options: 'i' },
			}, {
				name: { $regex: text || '', $options: 'i' },
			}, {
				patronymic: { $regex: text || '', $options: 'i' },
			}],
		}, {
			_id: { $not: { $in: prevResponsibleIds ?? [] } },
		}],
	}),
	fields: JSON.stringify({ surname: 1, name: 1, patronymic: 1 }),
	sort: JSON.stringify({ [column]: sortDir(direction) }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
}), [text, column, direction, prevResponsibleIds, itemsPerPage, current]);

function AutoCompletePersons({
	onSetPersonsArray,
	prevPersonsIdArray,
	onAutoCompleteLabel = null,
}) {
	const t = useTranslation();
	const setModal = useSetModal();

	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 10 });
	const [sort, setSort] = useState(['surname']);
	const [responsible, setResponsible] = useState([]);

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);

	const responsibleId = useMemo(() => responsible?.map((_responsible) => _responsible._id), [responsible]);

	const personsQuery = useQuery(debouncedParams, debouncedSort, responsibleId);

	const personsData = useEndpointData('persons.listToAutoComplete', personsQuery);

	const insertOrUpdatePerson = useMethod('insertOrUpdatePerson');

	useEffect(() => {
		if (prevPersonsIdArray && _.isArray(prevPersonsIdArray)) {
			setResponsible(prevPersonsIdArray);
		}
	}, [prevPersonsIdArray]);

	const handleChange = useCallback((responsibleArray) => {
		onSetPersonsArray && onSetPersonsArray(responsibleArray);
		setResponsible(responsibleArray);
	}, [onSetPersonsArray]);

	useMemo(() => console.dir({ responsible, filter: responsibleId }), [responsible, responsibleId]);

	const cancelModal = useCallback(() => setModal(undefined), [setModal]);

	const handleCreateNewPerson = useCallback(async (person) => {
		try {
			const personId = await insertOrUpdatePerson(person);
			console.dir({ person, personId });
			setResponsible([...responsible, { _id: personId, surname: person.surname, name: person.name, patronymic: person.patronymic }]);
			cancelModal();
		} catch (error) {
			console.error(error);
		}
	}, [cancelModal, responsible, insertOrUpdatePerson]);

	const onCreateNewPerson = () => {
		// eslint-disable-next-line new-cap
		setModal(() => NewPersonModal({ onCancel: cancelModal, onSave: handleCreateNewPerson }));
	};

	return <Box>
		<Field.Label>{onAutoCompleteLabel ?? t('Item_Responsible')}</Field.Label>
		<Autocomplete
			multiple
			id='tags-standard'
			options={personsData?.persons ?? []}
			value={responsible}
			forcePopupIcon={false}
			getOptionLabel={(option) => constructPersonFIO(option)}
			// getOptionSelected={(option, value) => option._id === value._id}
			renderOption={(option, state) =>
				<Box
					style={{ cursor: 'pointer' }}
					zIndex='100'
					width='100%'
					height='100%'
					onTouchStart={() => isIOS && handleChange([...responsible, option]) }
				>
					{constructPersonFIO(option)}
				</Box>
			}
			filterSelectedOptions
			filterOptions={createFilterOptions({ limit: 10 })}
			onChange={(event, value) => !isIOS && handleChange(value)}
			renderTags={(value, getTagProps) =>
				value.map((option, index) => (
					<Chip
						style={{ backgroundColor: '#e0e0e0', margin: '3px', borderRadius: '16px', color: '#000000DE' }}
						label={constructPersonFIO(option)} {...getTagProps({ index })} />
				))
			}
			renderInput={(params) => (
				<TextField
					{...params}
					style={{ touchAction: 'none' }}
					variant='outlined'
					placeholder={onAutoCompleteLabel ?? t('Item_Responsible')}
					onChange={(e) => setParams({ current: 0, itemsPerPage: 10, text: e.currentTarget.value }) }
				/>
			)}
			noOptionsText={
				<Button
					style={{ touchAction: 'none' }}
					onMouseDown={() => !isIOS && onCreateNewPerson()}
					onTouchStart={() => isIOS && onCreateNewPerson()}
					backgroundColor='inherit'
					borderColor='lightgrey'
					borderWidth='0.5px'
					textAlign='center'
					width='100%'
				>
					{ t('Participant_Create') }
				</Button>
			}
			onClose={(event, reason) => setParams({ current: 0, itemsPerPage: 10, text: '' }) }
		/>
	</Box>;
}

export default AutoCompletePersons;
