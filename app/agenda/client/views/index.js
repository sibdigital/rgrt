import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
	Field,
	Button,
	Label,
	ButtonGroup,
	Box, Callout, Tabs,
} from '@rocket.chat/fuselage';
import { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';
import s from 'underscore.string';
import moment from 'moment';

import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useRouteParameter } from '../../../../client/contexts/RouterContext';
import { useFormatDateAndTime } from '../../../../client/hooks/useFormatDateAndTime';
import { popover } from '../../../ui-utils/client/lib/popover';
import VerticalBar from '../../../../client/components/basic/VerticalBar';
import { GoBackButton } from '../../../utils/client/views/GoBackButton';
import { ENDPOINT_STATES, useEndpointDataExperimental } from '../../../../client/hooks/useEndpointDataExperimental';
import { constructPersonFIO } from '../../../utils/client/methods/constructPersonFIO';
import { useUserId } from '../../../../client/contexts/UserContext';
import { hasPermission } from '../../../authorization';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { downloadCouncilParticipantsForm } from '../../../councils/client/views/lib';
import { Sections } from './Sections';
import { EditSection } from './EditSection';
import { EditAgenda } from './EditAgenda';
import { Proposals } from './Proposals';
import { EditProposalsForTheAgenda } from './EditProposalsForTheAgenda';
import { ProposalsForTheAgendaPage } from './ProposalsForTheAgenda';

registerLocale('ru', ru);

export function AgendaPage() {
	const t = useTranslation();
	const id = useRouteParameter('id');
	const userId = useUserId();
	const isAllow = hasPermission('edit-councils', userId);

	const { data: agendaData, state: agendaState, error: agendaError } = useEndpointDataExperimental('agendas.findByCouncilId', useMemo(() => ({ query: JSON.stringify({ councilId: id }) }), [id])) || { };
	const { data: personsData, state: personsState } = useEndpointDataExperimental('persons.listToAutoComplete', useMemo(() => ({ }), [])) || { persons: [] };
	const { data: userData, state: userState, error: userError } = useEndpointDataExperimental('users.info', useMemo(() => ({
		userId,
		fields: JSON.stringify({ surname: 1, name: 1, patronymic: 1, organization: 1 }),
	}), [userId])) || { };

	if ([agendaState, personsState, userState].includes(ENDPOINT_STATES.LOADING)) {
		console.log('loading');
		return <Callout m='x16' type='danger'>{ t('Loading') }</Callout>;
	}

	// if (!isAllow) {
	// 	console.log('Permissions_access_missing');
	// 	return <Callout m='x16' type='danger'>{t('Permissions_access_missing')}</Callout>;
	// }

	return <Agenda agendaData={agendaData} personsData={personsData} userData={userData} isAllowEdit={isAllow}/>;
}

AgendaPage.displayName = 'AgendaPage';

export default AgendaPage;

function Agenda({ agendaData, personsData, userData, isAllowEdit }) {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const id = useRouteParameter('id');

	const [cache, setCache] = useState(new Date());
	const [context, setContext] = useState('');
	const [tab, setTab] = useState('agenda');
	const [isNew, setIsNew] = useState(true);
	const [agendaName, setAgendaName] = useState('');
	const [number, setNumber] = useState('');
	const [sectionsData, setSectionsData] = useState([]);
	const [sectionsDataView, setSectionsDataView] = useState({ sections: [] });
	const [agendaId, setAgendaId] = useState('');
	const [proposalsList, setProposalsList] = useState([]);
	const [currentAgendaData, setCurrentAgendaData] = useState({});
	const [currentSection, setCurrentSection] = useState({});
	const [currentProposal, setCurrentProposal] = useState({});

	const getSection = (section) => {
		console.log(section);
		const sections = [{
			label: [t('Agenda_issue_consideration'), ':'].join(''),
			value: section.issueConsideration ?? '',
			renderDirection: 'column',
		},
		// }, {
		// 	label: [t('Date'), ':'].join(''),
		// 	value: formatDateAndTime(new Date(section.date ?? '')),
		// }, {
		{
			label: [t('Agenda_speakers'), ':'].join(''),
			value: '',
			items: section.speakers?.map((speaker) => {
				speaker.value = constructPersonFIO(speaker);
				return speaker;
			}),
		}];

		if (section.initiatedBy && section.initiatedBy.value && s.trim(section.initiatedBy.value) !== '') {
			sections.unshift({
				label: [t('Agenda_initiated_by'), ':'].join(''),
				value: section.initiatedBy.value ?? '',
			});
		}
		if (section.item) {
			sections.unshift({
				item: true,
				hidden: true,
				label: [t('Proposal_for_the_agenda_item'), ':'].join(''),
				value: section.item ?? '',
			});
		}

		sections.unshift({
			_id: section._id,
			hidden: true,
		});

		return sections;
	};

	const onAgendaSectionInit = (sections) => {
		console.log(sections);
		setSectionsData(sections);
		setSectionsDataView({
			sections: sections?.map((section) => getSection(section)),
		});
	};

	const onAgendaInit = (agenda) => {
		setAgendaId(agenda._id ?? '');
		setAgendaName(agenda.name);
		setNumber(agenda.number);
		setProposalsList(agenda.proposals ?? []);
	};

	useEffect(() => {
		if (agendaData && agendaData.success) {
			console.log(agendaData);
			onAgendaInit(agendaData);
			onAgendaSectionInit(agendaData.sections ?? []);
			setIsNew(false);
			setCurrentAgendaData(agendaData);
		} else {
			// setContext('new');
		}
	}, [agendaData]);

	const deleteAgendaSection = useMethod('deleteAgendaSection');
	const updateAgendaSectionOrder = useMethod('updateAgendaSectionOrder');
	const updateProposalStatus = useMethod('updateProposalStatus');
	const downloadAgenda = useMethod('downloadAgenda');

	const handleTabClick = useMemo(() => (tab) => () => { setTab(tab); setContext(''); }, []);

	const onChange = useCallback(() => {
		setCache(new Date());
	}, [cache]);

	const onEditAgendaDataClick = useCallback((agenda) => {
		setIsNew(false);
		console.log(agenda);
		onAgendaInit(agenda);
		setCurrentAgendaData(agenda);
		onChange();
	}, []);

	const onEditSectionDataClick = useCallback((agenda, type = 'new') => {
		setIsNew(false);
		const arr = type !== 'new' ? sectionsData.map((section) => (section._id === agenda._id && agenda) || section) : sectionsData.concat(agenda);
		// console.log(arr);
		onAgendaSectionInit(arr);
		onChange();
	}, [sectionsData]);

	const close = useCallback(() => {
		setContext('');
		onChange();
	}, [onChange]);

	const onEditAgendaClick = useCallback((context) => () => {
		setContext(context);
	}, []);

	const onEditAgendaSectionClick = useCallback((id) => () => {
		sectionsData.forEach((section) => section._id === id && setCurrentSection(section));
		setContext('section-edit');
	}, [sectionsData]);

	const onEditProposal = useCallback((proposal) => {
		setCurrentProposal(proposal);
		setContext('proposal_for_the_agenda_edit');
	}, []);

	const onEditProposalDataClick = useCallback((proposal) => {
		const arr = proposalsList.map((_proposal) => (_proposal._id === proposal._id && proposal) || _proposal);
		setProposalsList(arr);
		setContext('');
		onChange();
	}, [proposalsList]);

	const onDeleteAgendaSectionClick = useCallback((sectionId, sectionIndex) => async () => {
		await deleteAgendaSection(agendaId, sectionId);
		await updateProposalStatus(agendaId, sectionsData[sectionIndex].proposalId, t('Agenda_status_deleted'));

		const proposals = proposalsList.map((proposal) => {
			if (proposal.proposalId === sectionsData[sectionIndex].proposalId) {
				proposal.status = t('Agenda_status_deleted');
			}
			return proposal;
		});
		setProposalsList(proposals);

		const arr = sectionsData.filter((section) => section._id !== sectionId);
		onAgendaSectionInit(arr);
		onChange();
	}, [sectionsData, proposalsList]);

	const onAgendaSectionOrderChange = useCallback((_index, type) => async () => {
		let isChange = false;
		const index = parseInt(_index);

		const arr = sectionsData;
		if (type === 'up') {
			if (index > 0 && index < sectionsData.length) {
				[arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
				isChange = true;
			}
		} else if (type === 'down') {
			if (index < sectionsData.length) {
				[arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
				isChange = true;
			}
		}

		console.log({ arr, index, type });
		await updateAgendaSectionOrder(agendaId, arr);

		if (isChange) {
			onAgendaSectionInit(arr);
			onChange();
		}
	}, [sectionsData]);

	const onSectionMenuClick = useCallback((event) => {
		const index = event.currentTarget.dataset.indexNumber;
		const items = [
			{
				name: t('Item_Edit'),
				action: onEditAgendaSectionClick(event.currentTarget.dataset.section),
			},
			{
				name: t('Item_Delete'),
				action: onDeleteAgendaSectionClick(event.currentTarget.dataset.section, index),
			},
		];

		if (index > 0) {
			items.push({ name: t('Item_Move_Up'), action: onAgendaSectionOrderChange(index, 'up') });
		}
		console.log({ lastIndex: sectionsData.length });
		if (index < sectionsData.length - 1) {
			items.push({ name: t('Item_Move_Down'), action: onAgendaSectionOrderChange(index, 'down') });
		}

		const config = {
			columns: [
				{
					groups: [
						{ items },
					],
				},
			],
			currentTarget: event.currentTarget,
			offsetVertical: 10,
		};
		popover.open(config);
	}, [sectionsData]);

	const onAgendaDownloadClick = useCallback(async (e) => {
		e.preventDefault();
		try {
			const res = await downloadAgenda({ _id: agendaId });
			const fileName = [t('Agenda'), ' ', moment(new Date(agendaData.ts)).format('DD MMMM YYYY'), '.docx'].join('');
			console.log({ docx: res });
			if (res) {
				downloadCouncilParticipantsForm({ res, fileName });
			}
		} catch (error) {
			console.log(error);
		}
	}, [agendaId, downloadAgenda]);

	return <Page flexDirection='row'>
		<Page>
			<Page.Header>
				<Field width={'100%'} display={'block'} marginBlock={'15px'}>
					<GoBackButton/>
					<Label fontScale='h1'>{t('Agenda')}</Label>
				</Field>
				{ context === '' && tab === 'agenda' && isAllowEdit
				&& <ButtonGroup>
					{ !isNew && <Button mbe='x8' disabled small primary aria-label={t('Agenda_download')} onClick={onAgendaDownloadClick}>
						{t('Agenda_download')}
					</Button>}
					{ isNew && <Button mbe='x8' small primary aria-label={t('Agenda_add')} onClick={onEditAgendaClick('new')}>
						{t('Agenda_add')}
					</Button>}
					{ !isNew && <Button mbe='x8' small primary aria-label={t('Agenda_edit')} onClick={onEditAgendaClick('edit')}>
						{t('Agenda_edit')}
					</Button>}
					{ !isNew && <Button mbe='x8' small primary aria-label={t('Agenda_section_add')} onClick={onEditAgendaClick('section-add')}>
						{t('Item_Add')}
					</Button> }
				</ButtonGroup>}

				{context === '' && tab === 'proposals' && !isAllowEdit
				&& <Button mbe='x8' small primary aria-label={t('Proposal_for_the_agenda_add')} onClick={() => setContext('proposal_for_the_agenda_new')}>
					{t('Proposal_for_the_agenda_add')}
				</Button>}
			</Page.Header>
			<Page.Content>
				<Tabs flexShrink={0} mbe='x16'>
					<Tabs.Item selected={tab === 'agenda'} onClick={handleTabClick('agenda')}>{t('Agenda')}</Tabs.Item>
					<Tabs.Item selected={tab === 'proposals'} onClick={handleTabClick('proposals')}>{t('Proposals_for_the_agenda')}</Tabs.Item>
				</Tabs>
				{ tab === 'agenda' && <Page.ScrollableContent mbe='x32'>
					<Box maxWidth='x800' w='full' alignSelf='center' pi='x32' pb='x24' fontSize='x16' borderStyle='solid' borderWidth='x2' borderColor='hint'>
						<Box mbe='x24' display='flex' flexDirection='column'>
							<Box is='span' fontScale='h1' alignSelf='center'>{agendaName}</Box>
						</Box>
						<Box mbe='x16' display='flex' flexDirection='column'>
							<Box is='span' alignSelf='center'>№ {number}</Box>
						</Box>
						<Sections data={sectionsDataView} onItemMenuClick={() => console.log('onItemMenuClick')} onSectionMenuClick={onSectionMenuClick} isAllowEdit={isAllowEdit}/>
					</Box>
				</Page.ScrollableContent>}
				{ tab === 'proposals'
				&& (
					(isAllowEdit
						&& <Proposals mode={'secretary'} onEditProposal={onEditProposal} userData={userData} proposalsListData={proposalsList} agendaId={agendaId} onAddProposal={onEditSectionDataClick}/>
					)
					|| (!isAllowEdit
						&& <ProposalsForTheAgendaPage isFullLoad={false} onAgendaClick={(proposal) => { setCurrentProposal(proposal); setContext('proposal_for_the_agenda_edit'); }}/>
					)
				)}
			</Page.Content>
		</Page>
		{ context
		&& <VerticalBar className='contextual-bar' width='x380' qa-context-name={`admin-user-and-room-context-${ context }`} flexShrink={0}>
			<VerticalBar.Header>
				{ context === 'new' && t('Agenda_added') }
				{ context === 'edit' && t('Agenda_edited') }
				{ context === 'section-add' && t('Agenda_item_added') }
				{ context === 'section-edit' && t('Agenda_item_edited') }
				{ context === 'proposal_for_the_agenda_edit' && t('Proposal_for_the_agenda_edited')}
				{ context === 'proposal_for_the_agenda_new' && t('Proposal_for_the_agenda_added')}
				<VerticalBar.Close onClick={close}/>
			</VerticalBar.Header>
			<VerticalBar.ScrollableContent>
				{context === 'new' && <EditAgenda councilId={id} onEditDataClick={onEditAgendaDataClick} close={close} onChange={onChange}/>}
				{context === 'edit' && <EditAgenda councilId={id} onEditDataClick={onEditAgendaDataClick} close={close} data={currentAgendaData} onChange={onChange}/>}
				{context === 'section-add' && <EditSection agendaId={agendaId} councilId={id} onEditDataClick={onEditSectionDataClick} close={close} onChange={onChange} personsOptions={personsData.persons}/>}
				{context === 'section-edit' && <EditSection data={currentSection} agendaId={agendaId} councilId={id} onEditDataClick={onEditSectionDataClick} close={close} onChange={onChange} personsOptions={personsData.persons}/>}
				{context === 'proposal_for_the_agenda_edit' && <EditProposalsForTheAgenda data={currentProposal} onEditDataClick={onEditProposalDataClick} close={close} agendaId={agendaId} userData={userData.user}/>}
				{context === 'proposal_for_the_agenda_new' && <EditProposalsForTheAgenda onEditDataClick={onEditProposalDataClick} close={close} agendaId={agendaData._id} userData={userData.user}/>}
			</VerticalBar.ScrollableContent>
		</VerticalBar>}
	</Page>;
}
