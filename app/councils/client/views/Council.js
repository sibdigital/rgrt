import React, { useMemo, useState } from 'react';
import {Button, Icon, Table} from '@rocket.chat/fuselage';

import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useRouteParameter} from '../../../../client/contexts/RouterContext';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { GenericTable, Th } from '../../../ui/client/components/GenericTable';
import { useFormatDate } from '../../../../client/hooks/useFormatDate';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import {useMethod} from "/client/contexts/ServerContext";

export function CouncilPage() {
	const t = useTranslation();
	const formatDate = useFormatDate();

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });

	const councilId = useRouteParameter('id');

	const query = useMemo(() => ({
		query: JSON.stringify({ _id: councilId }),
	}), [councilId]);

	const data = useEndpointData('councils.findOne', query) || { result: [] };

	const invitedUsers = data.invitedUsers || { };

	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const downloadCouncilParticipantsMethod = useMethod('downloadCouncilParticipants');

	const downloadCouncilParticipants = (_id) => async (e) => {
		e.preventDefault();
		try {
			const res = await downloadCouncilParticipantsMethod({ _id });
			const url = window.URL.createObjectURL(new Blob([res]));
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', 'file.docx');
			document.body.appendChild(link);
			link.click();
		} catch (e) {
			console.error('[index.js].downloadCouncilParticipants :', e);
		}
	};

	const header = useMemo(() => [
		<Th key={'fio'}>{t('Surname')} {t('Name')} {t('Patronymic')}</Th>,
		<Th key={'organization'}>{t('Council_organization')}</Th>,
		mediaQuery && <Th key={'position'}>{t('Job_Title')}</Th>,
		mediaQuery && <Th key={'phone'} style={{ width: '150px' }}>{t('Phone_number')}</Th>,
		mediaQuery && <Th key={'email'} style={{ width: '250px' }}>{t('Email')}</Th>,
		mediaQuery && <Th key={'createdAt'} style={{ width: '150px' }}>{t('Created_at')}</Th>,
	], [mediaQuery]);

	const renderRow = (invitedUser) => {
		const iu = invitedUser;
		return <Table.Row key={iu._id} tabIndex={0} role='link' action>
			<Table.Cell fontScale='p1' color='hint'>{iu.lastName} {iu.firstName} {iu.patronymic}</Table.Cell>
			<Table.Cell fontScale='p1' color='hint'>{iu.organization}</Table.Cell>
			{ mediaQuery && <Table.Cell fontScale='p1' color='hint'>{iu.position}</Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' color='hint'>{iu.phone}</Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' color='hint'>{iu.email}</Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' color='hint'>{formatDate(iu.ts)}</Table.Cell>}
		</Table.Row>;
	};

	return <Page flexDirection='row'>
		<Page>
			<Page.Header title={t('Council')}>
				<Button small onClick={downloadCouncilParticipants(councilId)} aria-label={t('Download')}>
					{t('Download_Council_Participant_List')}
				</Button>
			</Page.Header>
			<Page.Content>
				<GenericTable header={header} renderRow={renderRow} results={invitedUsers} setParams={setParams} params={params} />
			</Page.Content>
		</Page>
	</Page>;
}

CouncilPage.displayName = 'CouncilPage';

export default CouncilPage;
