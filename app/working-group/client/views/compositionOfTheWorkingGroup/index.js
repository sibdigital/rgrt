import React, { useCallback, useMemo, useState } from 'react';
import { Box, Button, ButtonGroup, Field, Icon, Label, Modal, Table } from '@rocket.chat/fuselage';

import Page from '../../../../../client/components/basic/Page';
import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { useRouteParameter } from '../../../../../client/contexts/RouterContext';
import { useEndpointData } from '../../../../../client/hooks/useEndpointData';
import { GenericTable, Th } from '../../../../../client/components/GenericTable';
import { useFormatDateAndTime } from '../../../../../client/hooks/useFormatDateAndTime';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { useMethod } from '../../../../../client/contexts/ServerContext';
import { useSetModal } from '../../../../../client/contexts/ModalContext';
import { settings } from '../../../../settings/client';
import { mime } from '../../../../utils/lib/mimeTypes';
import { fileUploadToWorkingGroup } from '../../../../ui';
import { useToastMessageDispatch } from '../../../../../client/contexts/ToastMessagesContext';

const style = { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' };

const DeleteWarningModal = ({ onDelete, onCancel, ...props }) => {
	const t = useTranslation();
	return <Modal {...props}>
		<Modal.Header>
			<Icon color='danger' name='modal-warning' size={20}/>
			<Modal.Title>{t('Are_you_sure')}</Modal.Title>
			<Modal.Close onClick={onCancel}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			{t('Delete_a_file')}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button ghost onClick={onCancel}>{t('Cancel')}</Button>
				<Button primary danger onClick={onDelete}>{t('Delete')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

const SuccessDeleteModal = ({ onClose, ...props }) => {
	const t = useTranslation();
	return <Modal {...props}>
		<Modal.Header>
			<Icon color='success' name='checkmark-circled' size={20}/>
			<Modal.Title>{t('Deleted')}</Modal.Title>
			<Modal.Close onClick={onClose}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			{t('File_has_been_deleted')}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button primary onClick={onClose}>{t('Ok')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export function CompositionOfTheWorkingGroupPage() {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const dispatchToastMessage = useToastMessageDispatch();

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });
	const [cache, setCache] = useState();

	const workingGroupId = useRouteParameter('id');

	const query = useMemo(() => ({
		query: JSON.stringify({ _id: workingGroupId}),
	}), [workingGroupId]);

	const data = useEndpointData('working-groups.list', query) || { result: [] };

	let workingGroupCompositionId = useRouteParameter('id');

	let workingGroupCompositionCountMembers = 0;

	console.log(data);

	if (data.workingGroups) {
		workingGroupCompositionCountMembers = data.workingGroups.length;
	}

	const filesId = useRouteParameter('id');

	workingGroupCompositionId = '11';

	const filesQuery = useMemo(() => ({
		query: JSON.stringify({ ['compositionOfTheWorkingGroup']: workingGroupCompositionId }),
		fields: JSON.stringify({ isComposition: true }),
		count: 25,
	}), [filesId, cache]);

	const files = useEndpointData('upload-files.list', filesQuery) || { result: [] };
	let filesArray = [];
	if (files.files) {
		filesArray = files.files;
	}
	console.log(filesArray);

	const setModal = useSetModal();

	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const deleteFileFromWorkingGroupMeeting = useMethod('deleteFileFromCompositionOfTheWorkingGroup');

	const downloadWorkingGroupParticipants = (file) => async (e) => {
		e.preventDefault();
		try {
			const filename = `${ file.name }`;
			if (window.navigator && window.navigator.msSaveOrOpenBlob) {
				const blob = new Blob([decodeURIComponent(encodeURI(JSON.stringify(file)))], { type: file.type });
				return navigator.msSaveOrOpenBlob(blob, filename);
			}
			const aElement = document.createElement('a');
			aElement.download = filename;
			aElement.href = `${ file.url }`;
			aElement.target = '_blank';
			console.log(aElement);
			document.body.appendChild(aElement);
			aElement.click();
			document.body.removeChild(aElement);
		} catch (e) {
			console.error('[index.js].downloadWorkingGroupParticipants: ', e);
		}
	};

	const onClick = useCallback(() => {
		FlowRouter.go(`/working-group`);
	}, []);

	const onChange = useCallback(() => {
		setCache(new Date());
	}, []);

	const fileUploadClick = (_id) => async (e) => {
		e.preventDefault();
		if (!settings.get('FileUpload_Enabled')) {
			return null;
		}
		const $input = $(document.createElement('input'));
		$input.css('display', 'none');
		$input.attr({
			id: 'fileupload-input',
			type: 'file',
			multiple: 'multiple',
		});

		$(document.body).append($input);

		$input.one('change', function(e) {
			const filesToUpload = [...e.target.files].map((file) => {
				Object.defineProperty(file, 'type', {
					value: mime.lookup(file.name),
				});
				return {
					file,
					name: file.name,
				};
			});

			_id = '11';
			fileUploadToWorkingGroup(filesToUpload, false, { _id });
			$input.remove();
			onChange();
		});
		$input.click();

		// Simple hack for iOS aka codegueira
		if (navigator.userAgent.match(/(iPad|iPhone|iPod)/g)) {
			$input.click();
		}
		onChange();
	};

	const onDeleteConfirm = (fileId) => async (e) => {
		e.preventDefault();
		try {
			await deleteFileFromWorkingGroupMeeting(fileId);
			setModal(() => <SuccessDeleteModal onClose={() => { setModal(undefined); close(); onChange(); }}/>);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			onChange();
		}
	};

	const openConfirmDelete = (fileId) => setModal(() => <DeleteWarningModal onDelete={onDeleteConfirm(fileId)} onCancel={() => setModal(undefined)}/>);

	const onDeleteConfirmDel = (fileId) => async (e) => {
		e.preventDefault();
		try {
			openConfirmDelete(fileId);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	const header = useMemo(() => [
		<Th key={'fileDescription'} color='default'>{t('Description')}</Th>,
		mediaQuery && <Th key={'fileName'} color='default'>{t('File_name')}</Th>,
		mediaQuery && <Th key={'fileUploadedAt'} color='default'>{t('File_uploaded_uploadedAt')}</Th>,
		<Th w='x40' key='download'></Th>,
		<Th w='x40' key='delete'></Th>,
	], [mediaQuery]);

	const renderRow = (files) => {
		let description = '';
		if (files.description) {
			description = files.description;
		} else {
			description = files.name;
		}
		return <Table.Row key={files._id} tabIndex={0} role='link' action>
			<Table.Cell fontScale='p1' color='default'>{description}</Table.Cell>
			{ mediaQuery && <Table.Cell fontScale='p1' style={style} color='default'>{files.name}</Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' style={{ width: '190px' }} color='default'>{formatDateAndTime(files.uploadedAt)}</Table.Cell>}
			<Table.Cell alignItems={'end'}>
				<Button small onClick={downloadWorkingGroupParticipants(files)} aria-label={t('Download')}>
					<Icon name='download'/>
				</Button>
			</Table.Cell>
			<Table.Cell alignItems={'end'}>
				<Button small onClick={onDeleteConfirmDel(files._id)} aria-label={t('Delete')}>
					<Icon name='trash'/>
				</Button>
			</Table.Cell>
		</Table.Row>;
	};

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
					<Label fontScale='h1'>{t('Working_group_composition')}</Label>
				</Field>
			</Page.Header>
			<Page.Content>
				<Field mbe='x8'>
					<Field.Label>{t('Working_group_composition_count_members')}</Field.Label>
					<Field.Row>
						<Box is='span' fontScale='p1'>{workingGroupCompositionCountMembers}</Box>
					</Field.Row>
				</Field>
				<Field mbe='x8'>
					<Field.Label>{t('Description')}</Field.Label>
					<Field.Row>
						<Box is='span' fontScale='p1'>{data.desc}</Box>
					</Field.Row>
				</Field>
				<Field mbe='x8'>
					<ButtonGroup>
						<Button small width='20%' onClick={onClick}>
							<Box is='span' fontScale='p1'>{t('Working_group')}</Box>
						</Button>
						<Button small width='20%' onClick={fileUploadClick(data._id)} data-id='file-upload'>
							<Box is='span' fontScale='p1'>{t('FileUpload')}</Box>
						</Button>
					</ButtonGroup>
				</Field>
				<GenericTable header={header} renderRow={renderRow} results={filesArray} onChange={onChange} total={filesArray.length} setParams={setParams} params={params} />
			</Page.Content>
		</Page>
	</Page>;
}

CompositionOfTheWorkingGroupPage.displayName = 'CompositionOfTheWorkingGroupPage';

export default CompositionOfTheWorkingGroupPage;
