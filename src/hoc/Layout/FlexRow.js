import React, { Component } from 'react';
import classes from './FlexRow.module.scss';
import * as alignClasses from '../../shared/alignFlex';

class FlexRow extends Component {
  render() {
    //spacing self
    const spacingClasses = [];
    if (this.props.spacing === 'left') {
      spacingClasses.push(classes.SpacingLeft);
    }
    if (this.props.spacing === 'right') {
      spacingClasses.push(classes.SpacingRight);
    }
    if (this.props.spacing === 'top') {
      spacingClasses.push(classes.SpacingTop);
    }
    if (this.props.spacing === 'bottom') {
      spacingClasses.push(classes.SpacingBottom);
    }
    if (this.props.spacing === 'bottom-notlast') {
      spacingClasses.push(classes.SpacingBottomNotLast);
    }

    //children spacing
    if (this.props.spacingchildren === 'left') {
      spacingClasses.push(classes.SpacingChildrenLeft);
    }
    if (this.props.spacingchildren === 'right') {
      spacingClasses.push(classes.SpacingChildrenRight);
    }
    if (this.props.spacingchildren === 'right-notlast') {
      spacingClasses.push(classes.SpacingChildrenRightNotLast);
    }
    if (this.props.spacingchildren === 'top') {
      spacingClasses.push(classes.SpacingChildrenTop);
    }
    if (this.props.spacingchildren === 'bottom') {
      spacingClasses.push(classes.SpacingChildrenBottom);
    }

    const justifyContent = alignClasses.justifyContent(
      this.props.justifyContent
    );
    const alignItems = alignClasses.alignItems(this.props.alignItems);
    const alignContent = alignClasses.alignContent(this.props.alignContent);
    const alignSelf = alignClasses.alignSelf(this.props.alignSelf);
    const flexShrink =
      this.props.flexshrink === 'true' ? classes.Flexshrink : null;
    const flexGrow = this.props.flexgrow === 'true' ? classes.Flexgrow : null;
    return (
      <div
        className={[
          classes.FlexRow,
          justifyContent,
          alignItems,
          alignContent,
          alignSelf,
          flexGrow,
          flexShrink,
          [...spacingClasses],
        ].join(' ')}
        {...this.props}>
        {this.props.children}
      </div>
    );
  }
}

export default FlexRow;
