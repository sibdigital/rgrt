import { Box, Field, Margins, TextInput, TextAreaInput, Select, Table, Button, Icon, Accordion } from '@rocket.chat/fuselage';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';
import s from 'underscore.string';

import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { Pager } from '../../../../../../client/views/setupWizard/Pager';
import { Step } from '../../../../../../client/views/setupWizard/Step';
import { StepHeader } from '../../../../../../client/views/setupWizard/StepHeader';
import { useFormatDate } from '../../../../../../client/hooks/useFormatDate';
import { useInvitePageContext } from '../InvitePageState';
import GenericTable, { Th } from '../../../../../../client/components/GenericTable';

registerLocale('ru', ru);

function WorkingGroupRequestInfoStep({ stepStyle, step, title, active, setWorkingGroupRequestData }) {
	const { goToNextStep, workingGroupRequestState } = useInvitePageContext();
	const t = useTranslation();
	const formatDate = useFormatDate();

	const [isSelectWGRequest, setIsSelectWGRequest] = useState(false);
	const [number, setNumber] = useState('');
	const [desc, setDesc] = useState('');

	const constructNumber = (request) => ['От ', formatDate(request.date ?? request.ts), ' № ', request.number ?? ' '].join('');

	useEffect(() => {
		if (workingGroupRequestState.data && workingGroupRequestState.data.number && workingGroupRequestState.data.desc) {
			setNumber(constructNumber(workingGroupRequestState.data));
			setDesc(workingGroupRequestState.data.desc);
		}
		if (workingGroupRequestState.workingGroupRequestId === 'all') {
			setIsSelectWGRequest(true);
		}
	}, [workingGroupRequestState]);

	const allFieldAreFilled = useMemo(() => s.trim(number) !== '' && s.trim(desc) !== '', [number, desc]);

	const onClick = useCallback((request) => {
		setNumber(constructNumber(request));
		setDesc(request.desc);
		setWorkingGroupRequestData(request);
	}, []);

	const handleSubmit = async (event) => {
		event.preventDefault();
		goToNextStep();
	};

	return <Step active={active} onSubmit={handleSubmit} style={stepStyle}>
		<StepHeader number={step} title={title} />

		<Margins blockEnd='x32'>
			<Box>
				<Box is='p' fontScale='p1' marginBlockEnd='x16'>{t('Working_group_request_invite_description')}</Box>
				{isSelectWGRequest
				&& <Box mbs='x16' mbe='x32' maxHeight='x500'>
					<Accordion>
						<Accordion.Item maxHeight='x450' title={t('Working_group_requests')}>
							<Box maxHeight='x450' overflow='auto'>
								<RequestsTable requests={workingGroupRequestState.data.requests ?? []} onClick={onClick}/>
							</Box>
						</Accordion.Item>
					</Accordion>
				</Box>
				}
				<Field>
					<Field.Label>{t('Query')}</Field.Label>
					<Field.Row>
						<TextInput flexGrow={1} readOnly fontScale='p1' value={number}/>
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Description')}</Field.Label>
					<Field.Row>
						<TextAreaInput flexGrow={1} value={desc} readOnly style={ { whiteSpace: 'normal', wordBreak: 'break-word' } } fontScale='p1' rows='8'/>
					</Field.Row>
				</Field>
			</Box>
		</Margins>

		<Pager isContinueEnabled={allFieldAreFilled || !workingGroupRequestState.data.workingGroupRequestId === 'all'}/>
	</Step>;
}

export default WorkingGroupRequestInfoStep;

function RequestsTable({ requests, onClick }) {
	const t = useTranslation();
	const formatDate = useFormatDate();
	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });

	const header = useMemo(() => [
		<Th key={'Number'} color='default'>
			{t('Number')}
		</Th>,
		<Th key={'Description'} color='default'>
			{ t('Description') }
		</Th>,
		<Th w='x200' key={'Date'} color='default'>
			{ t('Date') }
		</Th>,
	], []);

	const renderRow = (request) => {
		const { _id, number, desc, date, ts } = request;

		return <Table.Row key={_id} tabIndex={0} role='link' action onClick={() => onClick(request)}>
			<Table.Cell fontScale='p1' color='default'>{number}</Table.Cell>
			<Table.Cell fontScale='p1' color='default'>{desc}</Table.Cell>
			<Table.Cell fontScale='p1' color='default'>{formatDate(new Date(date ?? ts))}</Table.Cell>
		</Table.Row>;
	};
	return <GenericTable header={header} renderRow={renderRow} results={requests} total={requests.length} setParams={setParams} params={params}/>;
}
