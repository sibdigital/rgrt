import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {Box, Button, Field, Icon, Scrollable, Tabs} from '@rocket.chat/fuselage';

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

	return <Page flexDirection='row'>
		<Page>
			<Page.Header title={title}>
			</Page.Header>
			<Page.ScrollableContent>
				<Box maxWidth='700px' w='full' alignSelf='center'>
					<Field mbe='x8'>
						<Field.Row alignSelf='center'>
							<Box is='span' fontScale='p1'>{data.place}</Box>
						</Field.Row>
					</Field>
					<Sections data={data.sections} onSectionClick={onSectionClick}
							  onAddItemClick={onAddItemClick} onItemClick={onItemClick}/>
					<Button mbe='x8' small onClick={onAddSectionClick('new-section')} aria-label={t('New')}>
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
				<VerticalBar.Close onClick={close}/>
			</VerticalBar.Header>
			{context === 'new-section' && <AddSection goToNew={onSectionClick} close={close} onChange={onChange}/>}
			{context === 'new-item' && <AddItem goToNew={onItemClick} close={close} onChange={onChange}/>}
			{context === 'edit-section' && <EditSection protocolId={protocolId} _id={sectionId} close={close} onChange={onChange} cache={cache}/>}
			{context === 'edit-item' && <EditItem protocolId={protocolId} sectionId={sectionId} _id={itemId} close={close} onChange={onChange} cache={cache}/>}
		</VerticalBar>}
	</Page>;
}

ProtocolPage.displayName = 'ProtocolPage';

export default ProtocolPage;
