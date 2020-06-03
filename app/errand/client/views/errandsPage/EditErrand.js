import React, {useCallback, useMemo, useState} from 'react';
import {Box, Button, Field, SelectFiltered, Skeleton, TextAreaInput, TextInput,} from '@rocket.chat/fuselage';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import _ from 'underscore';

import {useTranslation} from '../../../../../client/contexts/TranslationContext';
import {ENDPOINT_STATES, useEndpointDataExperimental} from '../../../../../client/hooks/useEndpointDataExperimental';
import {useEndpointAction} from '../../../../../client/hooks/useEndpointAction';
import VerticalBar from '../../../../../client/components/basic/VerticalBar';
import {errandStatuses} from '../../../utils/statuses';


import {useEndpointData} from '../../../../../client/hooks/useEndpointData';
import { useUserId } from '../../../../../client/contexts/UserContext';


require('react-datepicker/dist/react-datepicker.css');

export function EditErrandContextBar({ erid, onChange }) {
	return <EditErrandWithData erid={erid} onChange={onChange}/>;
}

function EditErrandWithData({ erid, onChange }) {
	const query = useMemo(() => ({
		query: JSON.stringify({
			_id: erid,
		}),
		sort: JSON.stringify({ ts: -1 }),
		count: 1,
		offset: 0,
	}), [erid]);

	const { data = {}, state, error } = useEndpointDataExperimental('errands', query);

	if (state === ENDPOINT_STATES.LOADING) {
		return <Box w='full' pb='x24'>
			<Skeleton mbe='x4'/>
			<Skeleton mbe='x8' />
			<Skeleton mbe='x4'/>
			<Skeleton mbe='x8'/>
			<Skeleton mbe='x4'/>
			<Skeleton mbe='x8'/>
		</Box>;
	}

	if (state === ENDPOINT_STATES.ERROR) {
		return error.message;
	}

	return <EditErrand errand={data.result[0]} onChange={onChange}/>;
}

function EditErrand({ errand, onChange }) {
	const _t = useTranslation();
	errand.expireAt = new Date(errand.expireAt);
	const [newData, setNewData] = useState({});


	const hasUnsavedChanges = useMemo(() => Object.values(newData).filter((current) => current === null).length < Object.keys(newData).length, [JSON.stringify(newData)]);
	const saveQuery = useMemo(() => ({ _id: errand._id, ...Object.fromEntries(Object.entries(newData).filter(([, value]) => value !== null)) }), [errand._id, newData]);

	const saveAction = useEndpointAction('POST', 'errands.update', saveQuery, _t('Errand_updated_successfully'));

	const areEqual = (a, b) => a === b || !(a || b);

	const handleChange = (field, currentValue, getValue = (e) => e.currentTarget.value) => (e) => {
		console.log(getValue(e));
		setNewData({ ...newData, [field]: areEqual(getValue(e), currentValue) ? null : getValue(e) });
	};

	const handleChangeDate = (date) => {
		if (areEqual(errand.expireAt, date)) { return; }
		setNewData({
			...newData,
			expireAt: date,
		});
	};


	/* const handleChangeUser = (field, previousValue) => (_id) => {
		console.log(e);
		/!*if (areEqual(errand[field], date)) { return; }
		if (newData.chargedToUser) {
			newData.chargedToUser = _.findWhere(users.items, {
				_id: newData.chargedToUser,
			});
			setNewData(newData);
		}*!/
	};*/

	const userQuery = useMemo(() => ({
		query: JSON.stringify({
			rid: errand.rid,
		}),
	}), [errand.rid]);

	const users = useEndpointData('users.autocomplete.by_room', userQuery) || { items: [] };
	const curUser = _.findWhere(users.items, { _id: errand.chargedToUser._id });
	!curUser && users.items.push(errand.chargedToUser);
	const availableUsers = useMemo(() => users.items.map((item) => [item._id, item.username]), [users, users.items]);

	const handleSave = async () => {
		await Promise.all([hasUnsavedChanges && saveAction()].filter(Boolean));
		if (newData.chargedToUser) {
			const newUser = _.findWhere(users.items, { _id: newData.chargedToUser });
			console.log('newUser', newUser);
			newData.chargedToUser = newUser;
		}
		onChange(newData);
	};

	let chargedToUser = newData.chargedToUser ?? errand.chargedToUser;
	chargedToUser = typeof chargedToUser === 'string' ? chargedToUser : chargedToUser._id || '';
	const expireAt = newData.expireAt ?? errand.expireAt;
	const description = newData.desc ?? errand.desc;

	const errandStatus = newData.t ?? errand.t;
	const availableStatuses = errandStatuses.map((value) => [value, _t(value)]);
	const userId = useUserId();
	const isCurrentUsesInitiator = () => errand.initiatedBy._id === userId;

	const isCurrentUsesResponsible = () => errand.chargedToUser._id === userId;

	return <VerticalBar.ScrollableContent is='form' onSubmit={useCallback((e) => e.preventDefault(), [])}>
		<Field>
			<Field.Label>{_t('Errand_Initiated_by')}</Field.Label>
			<Field.Row>
				<TextInput disabled={true} value={errand.initiatedBy.username} flexGrow={1}/>
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{_t('Errand_Charged_to')}</Field.Label>
			<Field.Row>
				<SelectFiltered disabled={!isCurrentUsesInitiator()} options={availableUsers} value={chargedToUser} key='chargedUser' onChange={handleChange('chargedToUser', errand.chargedToUser, (value) => value, areEqual)} placeholder={_t('Errand_Charged_to')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{_t('Description')}</Field.Label>
			<Field.Row>
				<TextAreaInput disabled={!isCurrentUsesInitiator()} value={description} onChange={handleChange('desc', errand.desc)} flexGrow={1}/>
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{_t('Started_At')}</Field.Label>
			<Field.Row>
				<TextInput disabled={true} value={moment(errand.ts).format(moment.localeData().longDateFormat('L'))} flexGrow={1}/>
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{_t('Errand_Expired_date')}</Field.Label>
			<Field.Row>

					<DatePicker
						disabled={!isCurrentUsesInitiator()}
						dateFormat={'dd.MM.yyyy'}
						selected={expireAt}
						onChange={handleChangeDate}
						customInput={<TextInput />}
					/>

			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{_t('Status')}</Field.Label>
			<Field.Row>
				<SelectFiltered disabled={!isCurrentUsesResponsible() && !isCurrentUsesInitiator()} options={availableStatuses} value={errandStatus} key='status' onChange={handleChange('t', errand.t, (value) => value, areEqual)} placeholder={_t('Status')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Row>
				<Button mie='none' flexGrow={1} disabled={!hasUnsavedChanges || (!isCurrentUsesResponsible() && !isCurrentUsesInitiator())} onClick={handleSave}>{_t('Save')}</Button>
			</Field.Row>
		</Field>
	</VerticalBar.ScrollableContent>;
}
