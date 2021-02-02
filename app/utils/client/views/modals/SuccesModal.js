import { Button, ButtonGroup, Icon, Modal } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../../../../client/contexts/TranslationContext';

export const SuccessModal = ({
	title,
	contentText,
	onClose,
	headerIconSize = 20,
	...props
}) => {
	const t = useTranslation();
	return <Modal {...props}>
		<Modal.Header>
			<Icon color='success' name='checkmark-circled' size={headerIconSize}/>
			<Modal.Title>{title}</Modal.Title>
			<Modal.Close onClick={onClose}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			{contentText}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button primary onClick={onClose}>{t('Ok')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};
