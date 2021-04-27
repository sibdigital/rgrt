import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, Icon, Table } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { GenericTable, Th } from '../../../../client/components/GenericTable';
import { useFormatDateAndTime } from '../../../../client/hooks/useFormatDateAndTime';
import { useFormatDate } from '../../../../client/hooks/useFormatDate';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { SuccessModal, WarningModal } from '../../../utils/index';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useSetModal } from '../../../../client/contexts/ModalContext';

export function Materials({
	data,
	sort,
	onClick,
	onEditClick,
	onHeaderClick,
	onChange,
	setParams,
	params,
	baseArray,
	handleChangeCurrent,
	mediaQuery,
}) {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const formatDate = useFormatDate();

	const setModal = useSetModal();

	const [materials, setMaterials] = useState([]);

	useEffect(() => data?.files && setMaterials(data.files), [data]);

	const deleteMaterial = useMethod('deleteMaterial');
	const deleteFileFromCouncil = useMethod('deleteFileFromCouncil');
	const deleteFileFromErrand = useMethod('deleteFileFromErrand');

	const dispatchToastMessage = useToastMessageDispatch();

	const onDeleteConfirm = useCallback(async (material) => {
		let isDeleted = false;
		try {
			console.dir({ material });
			if (!isDeleted && material.councilId && material.councilId !== '') {
				isDeleted = await deleteFileFromCouncil(material.councilId, material._id);
			}
			if (!isDeleted && material.errandId && material.errandId !== '') {
				isDeleted = await deleteFileFromErrand(material.errandId, material._id);
			}
			if (!isDeleted) {
				await deleteMaterial(material._id);
			}
			setModal(() => <SuccessModal title={t('Deleted')} contentText={t('Files_Has_Been_Deleted')} onClose={() => { setModal(undefined); onChange(); }}/>);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [deleteFileFromCouncil, deleteFileFromErrand, deleteMaterial, dispatchToastMessage, onChange, setModal, t]);

	const onDel = (material) => () => { onDeleteConfirm(material); };

	const onDeleteClick = (material) => () => setModal(() => <WarningModal title={t('Are_you_sure')} contentText={t('Files_Delete_Warning')} onDelete={onDel(material)} onCancel={() => setModal(undefined)}/>);

	const header = useMemo(() => [
		<Th key={'name'} direction={sort[1]} active={sort[0] === 'num'} onClick={onHeaderClick} sort='name' color='default'>{t('Name')}</Th>,
		<Th key={'Errand_Base'} onClick={onHeaderClick} color='default'>{t('Errand_Base')}</Th>,
		<Th key={'tag'} direction={sort[1]} active={sort[0] === 'tag'} onClick={onHeaderClick} sort='tag' color='default'>{t('Region')}</Th>,
		<Th key={'File_uploaded_uploadedAt'} direction={sort[1]} active={sort[0] === 'uploadedAt'} onClick={onHeaderClick} sort='uploadedAt' w='x240' color='default'>{t('File_uploaded_uploadedAt')}</Th>,
		<Th w='x40' key='delete'/>,
	], [sort, onHeaderClick, t]);

	const getBase = useCallback((base) => {
		let result = { name: '', _id: '' };
		if (base.councilId && base.councilId !== '') {
			const council = baseArray.councils.find((council) => council._id === base.councilId);
			result = council && council._id ? { url: `/council/${ base.councilId }`, name: [t('Council'), ' от ', formatDate(council.d)].join('') } : { name: '', _id: '' };
		}
		if (base.errandId && base.errandId !== '') {
			const errand = baseArray.errands.find((errand) => errand._id === base.errandId);
			result = errand && errand._id ? { url: `/errand/${ base.errandId }`, name: [t('Errand'), ' от ', formatDate(errand.expireAt)].join('') } : { name: '', _id: '' };
		}
		if (base.workingGroupRequestId && base.workingGroupRequestId !== '') {
			const workingGroupRequest = baseArray.workingGroupRequests.find((workingGroupRequest) => workingGroupRequest._id === base.workingGroupRequestId);
			result = workingGroupRequest && workingGroupRequest._id ? { url: `/working-groups-request/${ base.workingGroupRequestId }`, name: [t('Working_group_request'), ' от ', formatDate(workingGroupRequest.date)].join('') } : { name: '', _id: '' };
		}
		return result;
	}, [baseArray, formatDate, t]);

	const renderRow = (material) => {
		const { _id, name, uploadedAt, tag } = material;
		const base = getBase(material);

		return <Table.Row key={_id} tabIndex={0} role='link' action>
			<Table.Cell fontScale='p1' onClick={onClick(_id)} color='default'>{name}</Table.Cell>
			<Table.Cell fontScale='p1' onClick={onClick(_id)} color='default'>
				{base?.name && base.name !== ''
					? <a href={base.url ?? ''}>{base.name}</a>
					: ''
				}
			</Table.Cell>
			<Table.Cell fontScale='p1' onClick={onClick(_id)} color='default'>{tag?.name ?? ''}</Table.Cell>
			<Table.Cell fontScale='p1' onClick={onClick(_id)} color='default'><Box withTruncatedText>{formatDateAndTime(uploadedAt)}</Box></Table.Cell>
			{ <Table.Cell alignItems={'end'}>
				<Button small onClick={onDeleteClick(material)} aria-label={t('Delete')}>
					<Icon name='trash'/>
				</Button>
			</Table.Cell>}
		</Table.Row>;
	};

	return <GenericTable isDefault={false} header={header} renderRow={renderRow} results={materials ?? []} total={data?.total ?? 0} setParams={setParams} params={params} setCurrentParam={handleChangeCurrent}/>;
}
