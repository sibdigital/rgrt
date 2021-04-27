import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Box, Field, Button } from '@rocket.chat/fuselage';
import { Autocomplete, createFilterOptions } from '@material-ui/lab';
import Chip from '@material-ui/core/Chip';
import TextField from '@material-ui/core/TextField';
import { isIOS } from 'react-device-detect';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';

import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useEndpointDataExperimental } from '../../../../client/hooks/useEndpointDataExperimental';
import { useFormatDateAndTime } from '../../../../client/hooks/useFormatDateAndTime';
import { useSetModal } from '../../../../client/contexts/ModalContext';

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const useQuery = ({ text, itemsPerPage, current }, [column, direction], prevIds) => useMemo(() => ({
	query: JSON.stringify({
		$and: [{
			$or: [{
				name: { $regex: text || '', $options: 'i' },
			}],
		}, {
			_id: { $not: { $in: prevIds ?? [] } },
		}, {
			'type.name': 'region',
		}],
	}),
	fields: JSON.stringify({ name: 1, region: 1 }),
	sort: JSON.stringify({ [column]: sortDir(direction) }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
}), [text, column, direction, prevIds, itemsPerPage, current]);

function AutoCompleteRegions({ onSetTags, prevTags, ...props }) {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();

	const [currentTag, setCurrentTag] = useState('');
	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 10 });
	const [sort, setSort] = useState(['name']);
	const [prevTagsId, setPrevTags] = useState([]);

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);

	const query = useQuery(debouncedParams, debouncedSort, prevTagsId);

	const { data: tagsData } = useEndpointDataExperimental('tags.list', query);

	useMemo(() => console.dir({ tagsData }), [tagsData]);

	const handleChange = useCallback((value) => {
		setCurrentTag(value);
		onSetTags && tagsData?.tags && onSetTags(value);
	}, [onSetTags, tagsData]);

	return <Box display='flex' flexDirection='row' {...props}>
		<Field.Label alignSelf='center' maxWidth='max-content' mie='x8'>{t('Region')}</Field.Label>
		<Autocomplete
			fullWidth
			// multiple
			id='tags-standard'
			options={tagsData?.tags ?? []}
			// value={currentTag}
			forcePopupIcon={false}
			getOptionLabel={(option) => option.name}
			// getOptionSelected={(option, value) => option._id === value._id}
			renderOption={(option, state) =>
				<Box
					style={{ cursor: 'pointer' }}
					zIndex='100'
					width='100%'
					height='100%'
					onTouchStart={() => isIOS && handleChange([...currentTag, option]) }
				>
					{option.name}
				</Box>
			}
			filterSelectedOptions
			filterOptions={createFilterOptions({ limit: 10 })}
			onChange={(event, value) => !isIOS && handleChange(value)}
			renderTags={(value, getTagProps) =>
				value.map((option, index) => (
					<Chip
						style={{ backgroundColor: '#e0e0e0', margin: '3px', borderRadius: '16px', color: '#000000DE' }}
						label={option.name} {...getTagProps({ index })} />
				))
			}
			renderInput={(params) => (
				<TextField
					{...params}
					style={{ touchAction: 'none' }}
					variant='outlined'
					placeholder={t('Select_Subject_RF')}
					onChange={(e) => setParams({ current: 0, itemsPerPage: 10, text: e.currentTarget.value }) }
				/>
			)}
			noOptionsText={t('No_data_found')}
			onClose={(event, reason) => setParams({ current: 0, itemsPerPage: 10, text: '' }) }
		/>
	</Box>;
}

AutoCompleteRegions.displayName = 'AutoCompleteRegions';

export default AutoCompleteRegions;