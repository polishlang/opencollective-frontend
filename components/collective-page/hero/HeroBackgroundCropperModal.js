import React from 'react';
import PropTypes from 'prop-types';
import Cropper from 'react-easy-crop';
import { FormattedMessage } from 'react-intl';

import Container from '../../Container';
import { Box, Flex } from '../../Grid';
import StyledButton from '../../StyledButton';
import StyledModal, { ModalFooter, ModalHeader } from '../../StyledModal';
import { Span } from '../../Text';

import { BASE_HERO_WIDTH, StyledHeroBackground } from './HeroBackground';
import HeroBackgroundEdit from './HeroBackgroundEdit';

const HeroBackgroundCropperModal = ({ onClose, collective }) => {
  return (
    <StyledModal show onClose={onClose}>
      <ModalHeader mb={3}>
        <Span fontSize="20px" fontWeight="500">
          <FormattedMessage defaultMessage="Add cover image" />
        </Span>
      </ModalHeader>
      <Container position="relative" width="600px" maxWidth="100%">
        <HeroBackgroundEdit collective={collective} />
      </Container>

      <ModalFooter>
        <Flex justifyContent="center">
          <StyledButton mx={2}>
            <FormattedMessage id="Reset" defaultMessage="Reset" />
          </StyledButton>
          <StyledButton mx={2} buttonStyle="primary">
            <FormattedMessage defaultMessage="Done" />
          </StyledButton>
        </Flex>
      </ModalFooter>
    </StyledModal>
  );
};

HeroBackgroundCropperModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  collective: PropTypes.shape({
    backgroundImageUrl: PropTypes.string.isRequired,
  }).isRequired,
};

export default HeroBackgroundCropperModal;
