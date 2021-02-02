import { Button, ButtonGroup, Icon, Modal } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../../../../client/contexts/TranslationContext';

export const WarningModal = ({
	title,
	contentText,
	onDelete,
	onCancel,
	headerIconSize = 20,
	...props
}) => {
	const t = useTranslation();
	return <Modal {...props}>
		<Modal.Header>
			<Icon color='danger' name='modal-warning' size={headerIconSize}/>
			<Modal.Title>{title}</Modal.Title>
			<Modal.Close onClick={onCancel}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			{contentText}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button ghost onClick={onCancel}>{t('Cancel')}</Button>
				<Button primary danger onClick={onDelete}>{t('Delete')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};
