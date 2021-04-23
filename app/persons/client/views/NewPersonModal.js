import React from 'react';
import { Modal } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import PersonForm from './PersonForm';

function NewPersonModal({ onCancel, onSave, ...props }) {
	const t = useTranslation();

	return <Modal {...props}>
		<Modal.Header>
			<Modal.Title>{t('Participant_Creating')}</Modal.Title>
			<Modal.Close onClick={onCancel}/>
		</Modal.Header>
		<Modal.Content fontScale='p1' mb='x24'>
			<PersonForm isWeight={false} onShowCancelAndSaveButtons={true} onCancel={onCancel} onSave={onSave}/>
		</Modal.Content>
	</Modal>;
}

export default NewPersonModal;
