import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Box, Field, Button } from '@rocket.chat/fuselage';
import { Autocomplete, createFilterOptions } from '@material-ui/lab';
import Chip from '@material-ui/core/Chip';
import TextField from '@material-ui/core/TextField';
import { isIOS } from 'react-device-detect';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import _ from 'underscore';

import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { ENDPOINT_STATES, useEndpointDataExperimental } from '../../../../client/hooks/useEndpointDataExperimental';
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

function AutoCompleteRegions({
	onSetTags,
	prevTags,
	isMultiple = false,
	...props
}) {
	const t = useTranslation();

	const [currentTag, setCurrentTag] = useState({});
	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 10 });
	const [sort, setSort] = useState(['region.name', 'asc']);
	// const [prevTagsId, setPrevTagsId] = useState(_.isArray(prevTags) ? prevTags.map((tag) => tag._id) : []);

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);

	const prevTagsId = useMemo(() => {
		let result = [];
		if (_.isArray(prevTags)) {
			result = prevTags.map((tag) => tag._id);
		} else if (prevTags && prevTags._id) {
			result = [prevTags._id];
		}
		return result;
	}, [prevTags]);

	const query = useQuery(debouncedParams, debouncedSort, prevTagsId);

	const { data: tagsData, state: tagsState } = useEndpointDataExperimental('tags.list', query);

	useEffect(() => {
		if (prevTags) {
			setCurrentTag(prevTags);
		}
	}, [prevTags]);

	// useMemo(() => console.dir({ tagsData }), [tagsData]);
	useMemo(() => console.dir({ prevTagsId }), [prevTagsId]);

	const handleChange = useCallback((value) => {
		setCurrentTag(value);
		onSetTags && tagsData?.tags && onSetTags(value);
	}, [onSetTags, tagsData]);

	return <Box display='flex' flexDirection='row' {...props}>
		<Field.Label alignSelf='center' maxWidth='max-content' mie='x8'>{t('Region')}</Field.Label>
		<Autocomplete
			loading={tagsState === ENDPOINT_STATES.LOADING}
			loadingText={t('Loading')}
			fullWidth
			multiple={isMultiple}
			id='tags-standard'
			options={tagsData?.tags ?? []}
			value={currentTag}
			forcePopupIcon={false}
			getOptionLabel={(option) => option?.name ?? ''}
			// getOptionSelected={(option, value) => option._id === value._id}
			renderOption={(option, state) =>
				<Box
					style={{ cursor: 'pointer' }}
					zIndex='100'
					width='100%'
					height='100%'
					onTouchStart={() => isIOS && handleChange([...currentTag, option]) }
				>
					{option?.name ?? ''}
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
			noOptionsText={tagsState === ENDPOINT_STATES.LOADING ? t('Loading') : t('No_data_found')}
			onClose={(event, reason) => setParams({ current: 0, itemsPerPage: 10, text: '' }) }
		/>
	</Box>;
}

AutoCompleteRegions.displayName = 'AutoCompleteRegions';

export default AutoCompleteRegions;
