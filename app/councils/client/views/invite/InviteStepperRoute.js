import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { useEffect, useState } from 'react';

import { useRole } from '../../contexts/AuthorizationContext';
import { useRoute } from '../../contexts/RouterContext';
import { useSetting } from '../../contexts/SettingsContext';
import { useUserId, useUser } from '../../contexts/UserContext';
import InvitePageState from './InvitePageState';

const useRouteLock = () => {
	const [locked, setLocked] = useState(true);

	const userId = useUserId();
	const user = useDebouncedValue(useUser(), 100);
	const hasAdminRole = useRole('admin');
	const homeRoute = useRoute('home');

	useEffect(() => {
		if (!InvitePageState) {
			return;
		}

		if (userId && !user?.status) {
			return;
		}

		const isComplete = InvitePageState === 'completed';
		const noUserLoggedInAndIsNotPending = locked && !user && InvitePageState !== 'pending';
		const userIsLoggedInButIsNotAdmin = !!user && !hasAdminRole;

		const mustRedirect = isComplete || noUserLoggedInAndIsNotPending || userIsLoggedInButIsNotAdmin;

		if (mustRedirect) {
			homeRoute.replace();
			return;
		}

		setLocked(false);
	}, [homeRoute, InvitePageState, userId, user, hasAdminRole]);

	return locked;
};

export function InviteStepperRoute() {
	const locked = useRouteLock();

	if (locked) {
		return null;
	}

	return <InvitePageState />;
}

export default InviteStepperRoute;
