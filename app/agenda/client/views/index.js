import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
	Field,
	Button,
	Label,
	ButtonGroup,
	Box, Callout,
} from '@rocket.chat/fuselage';
import { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';

import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useRouteParameter } from '../../../../client/contexts/RouterContext';
import { useFormatDateAndTime } from '../../../../client/hooks/useFormatDateAndTime';
import { popover } from '../../../ui-utils/client/lib/popover';
import VerticalBar from '../../../../client/components/basic/VerticalBar';
import { GoBackButton } from '../../../utils/client/views/GoBackButton';
import { ENDPOINT_STATES, useEndpointDataExperimental } from '../../../../client/hooks/useEndpointDataExperimental';
import { constructPersonFullFIO } from '../../../utils/client/methods/constructPersonFIO';
import { Sections } from './Sections';
import { EditSection } from './EditSection';
import { EditAgenda } from './EditAgenda';

registerLocale('ru', ru);

export function AgendaPage() {
	const t = useTranslation();
	const id = useRouteParameter('id');

	const { data: agendaData, state: agendaState, error: agendaError } = useEndpointDataExperimental('agendas.findByCouncilId', useMemo(() => ({ query: JSON.stringify({ councilId: id }) }), [id])) || { };
	const { data: personsData, state: personsState } = useEndpointDataExperimental('persons.listToAutoComplete', useMemo(() => ({ }), [])) || { persons: [] };

	if ([agendaState, personsState].includes(ENDPOINT_STATES.LOADING)) {
		console.log('loading');
		return <Callout m='x16' type='danger'>{ t('Loading') }</Callout>;
	}

	return <Agenda agendaData={agendaData} personsData={personsData}/>;
}

AgendaPage.displayName = 'AgendaPage';

export default AgendaPage;

function Agenda({ agendaData, personsData }) {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const id = useRouteParameter('id');

	const [cache, setCache] = useState(new Date());
	const [context, setContext] = useState('');
	const [isNew, setIsNew] = useState(true);
	const [agendaName, setAgendaName] = useState('');
	const [number, setNumber] = useState('');
	const [sectionsData, setSectionsData] = useState([]);
	const [sectionsDataView, setSectionsDataView] = useState({ sections: [] });
	const [agendaId, setAgendaId] = useState('');
	const [currentSection, setCurrentSection] = useState({});

	const onAgendaSectionInit = (sections) => {
		setSectionsDataView({
			sections: sections?.map((section) => [
				{
					_id: section._id,
					hidden: true,
				},
				{
					label: [t('Agenda_issue_consideration'), ':'].join(''),
					value: section.issueConsideration ?? '',
				}, {
					label: [t('Date'), ':'].join(''),
					value: formatDateAndTime(new Date(section.date ?? '')),
				}, {
					label: [t('Agenda_speakers'), ':'].join(''),
					value: '',
					items: section.speakers?.map((speaker) => {
						speaker.value = constructPersonFullFIO(speaker);
						return speaker;
					}),
				},
			]),
		});
	};
	const onAgendaInit = (agenda) => {
		setAgendaId(agenda._id ?? '');
		setAgendaName(agenda.name);
		setNumber(agenda.number);
		setSectionsData(agenda.sections);
		onAgendaSectionInit(agenda.sections ?? []);
	};

	useEffect(() => {
		// console.log(agendaData);
		if (agendaData && agendaData.success) {
			onAgendaInit(agendaData);
			setIsNew(false);
		} else {
			setContext('new');
		}
	}, [agendaData]);

	const onChange = useCallback(() => {
		setCache(new Date());
	}, [cache]);

	const onEditAgendaDataClick = useCallback((agenda) => {
		setIsNew(false);
		onChange();
	}, []);

	const onEditSectionDataClick = useCallback((agenda, type = 'new') => {
		setIsNew(false);
		const arr = type !== 'new' ? sectionsData.map((section) => (section._id === agenda._id && agenda) || section) : sectionsData.concat(agenda);
		setSectionsData(arr);
		// console.log(arr);
		onAgendaSectionInit(arr);
		onChange();
	}, [sectionsData]);

	const close = useCallback(() => {
		setContext('');
	}, []);

	const onEditAgendaClick = useCallback((context) => () => {
		setContext(context);
	}, []);

	const onEditAgendaSectionClick = useCallback((id) => () => {
		// console.log(id);
		// console.log(sectionsData);
		sectionsData.forEach((section) => section._id === id && setCurrentSection(section));
		setContext('section-edit');
	}, [sectionsData]);

	const onSectionMenuClick = useCallback((event) => {
		const items = [
			{
				name: t('Section_Edit'),
				action: onEditAgendaSectionClick(event.currentTarget.dataset.section),
			},
		];
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

	return <Page flexDirection='row'>
		<Page>
			<Page.Header>
				<Field width={'100%'} display={'block'} marginBlock={'15px'}>
					<GoBackButton/>
					<Label fontScale='h1'>{t('Agenda')}</Label>
				</Field>
				<ButtonGroup>
					{ isNew && <Button mbe='x8' small primary aria-label={t('Agenda_add')} onClick={onEditAgendaClick('new')}>
						{t('Agenda_add')}
					</Button>}
					{ !isNew && <Button mbe='x8' small primary aria-label={t('Agenda_edit')} onClick={onEditAgendaClick('edit')}>
						{t('Agenda_edit')}
					</Button>}
					{ !isNew && <Button mbe='x8' small primary aria-label={t('Agenda_section_add')} onClick={onEditAgendaClick('section-add')}>
						{t('Agenda_section_add')}
					</Button> }
				</ButtonGroup>
			</Page.Header>
			<Page.Content>
				<Page.ScrollableContent>
					<Box maxWidth='x800' w='full' alignSelf='center' pi='x32' pb='x24' fontSize='x16' borderStyle='solid' borderWidth='x2' borderColor='hint'>
						<Box mbe='x24' display='flex' flexDirection='column'>
							<Box is='span' fontScale='h1' alignSelf='center'>{agendaName}</Box>
						</Box>
						<Box mbe='x16' display='flex' flexDirection='column'>
							<Box is='span' alignSelf='center'>{number}</Box>
						</Box>
						<Sections data={sectionsDataView} onItemMenuClick={() => console.log('onItemMenuClick')} onSectionMenuClick={onSectionMenuClick}/>
					</Box>
				</Page.ScrollableContent>
			</Page.Content>
		</Page>
		{ context
		&& <VerticalBar className='contextual-bar' width='x380' qa-context-name={`admin-user-and-room-context-${ context }`} flexShrink={0}>
			<VerticalBar.Header>
				{ context === 'new' && t('Agenda_added') }
				{ context === 'edit' && t('Agenda_edited') }
				{ context === 'section-add' && t('Agenda_added') }
				{ context === 'section-edit' && t('Agenda_edited') }
				<VerticalBar.Close onClick={close}/>
			</VerticalBar.Header>
			{context === 'new' && <EditAgenda councilId={id} onEditDataClick={onEditAgendaDataClick} close={close} onChange={onChange}/>}
			{context === 'edit' && <EditAgenda councilId={id} onEditDataClick={onEditAgendaDataClick} close={close} data={agendaData} onChange={onChange}/>}
			{context === 'section-add' && <EditSection agendaId={agendaId} councilId={id} onEditDataClick={onEditSectionDataClick} close={close} onChange={onChange} personsOptions={personsData.persons}/>}
			{context === 'section-edit' && <EditSection data={currentSection} agendaId={agendaId} councilId={id} onEditDataClick={onEditSectionDataClick} close={close} onChange={onChange} personsOptions={personsData.persons}/>}
		</VerticalBar>}
	</Page>;
}
