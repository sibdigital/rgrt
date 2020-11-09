import React, { useCallback, useMemo, useState } from 'react';
import { Box, Button, ButtonGroup, Field, Icon, Label } from '@rocket.chat/fuselage';

import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useRoute, useRouteParameter } from '../../../../client/contexts/RouterContext';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { useFormatDate } from '../../../../client/hooks/useFormatDate';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { Sections } from './Sections';
import VerticalBar from "/client/components/basic/VerticalBar";
import { AddSection } from './AddSection';
import { AddItem } from './AddItem';
import { EditSection } from './EditSection';
import { EditItem } from './EditItem';
import { Participants } from '../views/participants/Participants';
import { AddParticipant } from '../views/participants/AddParticipant';
import { CreateParticipant } from '../views/participants/CreateParticipant';

export function ProtocolPage() {
	const t = useTranslation();
	const formatDate = useFormatDate();

	const [cache, setCache] = useState();

	const router = useRoute('protocol');
	const protocolId = useRouteParameter('id');
	const context = useRouteParameter('context');
	const sectionId = useRouteParameter('sectionId');
	const itemId = useRouteParameter('itemId');

	const query = useMemo(() => ({
		query: JSON.stringify({ _id: protocolId }),
	}), [protocolId, cache]);

	const data = useEndpointData('protocols.findOne', query) || {};

	const title = t('Protocol').concat(' ').concat(data.num).concat(' ').concat(t('Date_to')).concat(' ').concat(formatDate(data.d));

	const downloadProtocolParticipantsMethod = useMethod('downloadProtocolParticipants');

	const downloadProtocolParticipants = (_id) => async (e) => {
		e.preventDefault();
		try {
			const res = await downloadProtocolParticipantsMethod({ _id });
			const url = window.URL.createObjectURL(new Blob([res]));
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', 'file.docx');
			document.body.appendChild(link);
			link.click();
		} catch (e) {
			console.error('[index.js].downloadProtocolParticipants :', e);
		}
	};

	const onAddSectionClick = useCallback((context) => () => {
		router.push({ id: protocolId, context: context });
	}, [router]);

	const onSectionClick = useCallback((_id) => () => {
		router.push({
			id: protocolId,
			context: 'edit-section',
			sectionId: _id,
		});
	}, [router]);

	const onChange = useCallback(() => {
		setCache(new Date());
	}, []);

	const close = useCallback(() => {
		router.push({
			id: protocolId,
		});
	}, [router]);

	const onAddItemClick = useCallback((context, sectionId) => () => {
		router.push({
			id: protocolId,
			context: context,
			sectionId: sectionId
		});
	}, [router]);

	const onItemClick = useCallback((sectionId, _id) => () => {
		router.push({
			id: protocolId,
			context: 'edit-item',
			sectionId: sectionId,
			itemId: _id
		});
	}, [router]);

	const onParticipantsClick = useCallback((context) => () => {
		router.push({ id: protocolId, context: context });
	}, [router]);

	const onAddParticipantClick = useCallback((context) => () => {
		router.push({
			id: protocolId,
			context: context
		});
	}, [router]);

	const goBack = () => {
		window.history.back();
	};

	return <Page flexDirection='row'>
		<Page>
			<Page.Header>
				<Field width={'100%'} display={'block'} marginBlock={'15px'}>
					<Button className='go-back-button' onClick={goBack}>
						<Icon name='back'/>
					</Button>
					<Label fontScale='h1'>{t('Protocol')}</Label>
				</Field>
			</Page.Header>
			<Page.ScrollableContent>
				<ButtonGroup>
					<Button mbe='x8' small primary onClick={onParticipantsClick('participants')} aria-label={t('Participants')}>
						{t('Participants')}
					</Button>
				</ButtonGroup>
				<Box maxWidth='x800' w='full' alignSelf='center' pi='x32' pb='x24' fontSize='x16' borderStyle='solid' borderWidth='x2' borderColor='hint'>
					<Box mbe='x24' display='flex' flexDirection='column'>
						<Box is='span' fontScale='h1' alignSelf='center'>{title}</Box>
					</Box>
					<Box mbe='x16' display='flex' flexDirection='column'>
						<Box is='span' alignSelf='center'>{data.place}</Box>
					</Box>
					<Sections data={data.sections} onSectionClick={onSectionClick}
							  onAddItemClick={onAddItemClick} onItemClick={onItemClick}/>
					<Button mbe='x8' small primary onClick={onAddSectionClick('new-section')} aria-label={t('New')}>
						{t('Section_Add')}
					</Button>
				</Box>
			</Page.ScrollableContent>
		</Page>
		{ context
		&& <VerticalBar className='contextual-bar' width='x380' qa-context-name={`admin-user-and-room-context-${ context }`} flexShrink={0}>
			<VerticalBar.Header>
				{ context === 'new-section' && t('Section_Add') }
				{ context === 'new-item' && t('Item_Add') }
				{ context === 'edit-section' && t('Section_Info') }
				{ context === 'edit-item' && t('Item_Info') }
				{ context === 'participants' && t('Participants') }
				{ context === 'add-participant' && t('Participant_Add') }
				{ context === 'create-participant' && t('Participant_Create') }
				<VerticalBar.Close onClick={close}/>
			</VerticalBar.Header>
			{context === 'new-section' && <AddSection goToNew={onSectionClick} close={close} onChange={onChange}/>}
			{context === 'new-item' && <AddItem goToNew={onItemClick} close={close} onChange={onChange}/>}
			{context === 'edit-section' && <EditSection protocolId={protocolId} _id={sectionId} close={close} onChange={onChange} cache={cache}/>}
			{context === 'edit-item' && <EditItem protocolId={protocolId} sectionId={sectionId} _id={itemId} close={close} onChange={onChange} cache={cache}/>}
			{context === 'participants' && <Participants protocolId={protocolId} onAddParticipantClick={onAddParticipantClick} close={close}/>}
			{context === 'add-participant' && <AddParticipant protocolId={protocolId} close={onParticipantsClick} onCreateParticipant={onAddParticipantClick}/>}
			{context === 'create-participant' && <CreateParticipant goTo={onParticipantsClick} close={onParticipantsClick}/>}
		</VerticalBar>}
	</Page>;
}

ProtocolPage.displayName = 'ProtocolPage';

export default ProtocolPage;
