import { caretDownIcon, caretRightIcon } from '@jupyterlab/ui-components';
import * as React from 'react';
import {
  changeStageButtonStyle,
  sectionAreaStyle,
  sectionFileContainerStyle
} from '../style/GitStageStyle';
import { Git } from '../tokens';
import { GitExtension } from '../model';
import { hiddenButtonStyle } from '../style/ActionButtonStyle';
import { ActionButton } from './ActionButton';
import { addIcon, discardIcon, removeIcon } from '../style/icons';
import { TranslationBundle } from '@jupyterlab/translation';
import { UseSignal } from '@jupyterlab/apputils';
import { FixedSizeList } from 'react-window';
import {
  listStyle,
  sectionButtonContainerStyle,
  sectionHeaderLabelStyle,
  stashFileStyle
} from '../style/GitStashStyle';
import { FilePath } from './FilePath';

const HEADER_HEIGHT = 34;
const ITEM_HEIGHT = 25;

export interface IGitStashProps {
  /**
   * Actions component to display at the far right of the stage
   */
  actions?: React.ReactElement;

  /**
   * Is this group collapsible
   */
  collapsible?: boolean;

  /**
   * Git extension model
   */
  model: GitExtension;

  /**
   * Files in the group
   */
  stash: Git.IStash;
  /**
   * HTML element height
   */
  height: number;
  /**
   * Optional select all element
   */
  selectAllButton?: React.ReactElement;

  /**
   * The application language translator.
   */
  trans: TranslationBundle;

  /**
   * Wrap mouse event handler to stop event propagation
   * @param fn Mouse event handler
   * @returns Mouse event handler that stops event from propagating
   */
  stopPropagationWrapper: (
    fn: React.EventHandler<React.MouseEvent>
  ) => React.EventHandler<React.MouseEvent>;
}

interface IGitStashEntryProps {
  /**
   * Actions component to display at the far right of the stage
   */
  actions?: React.ReactElement;

  /**
   * Git extension model
   */
  model: GitExtension;
  /**
   * Is this group collapsible
   */
  collapsible?: boolean;
  /**
   * Files corresponding to the stash
   */
  files: string[];
  /**
   * Index within the stash
   */
  index: number;
  /**
   * HTML element height
   */
  height: number;
  /**
   * Optional select all element
   */
  selectAllButton?: React.ReactElement;

  /**
   * The application language translator.
   */
  trans: TranslationBundle;

  /**
   * Branch corresponding to the stash
   */
  branch: string;

  /**
   * message corresponding to the stash
   */
  message: string;

  /**
   * Wrap mouse event handler to stop event propagation
   * @param fn Mouse event handler
   * @returns Mouse event handler that stops event from propagating
   */
  stopPropagationWrapper: (
    fn: React.EventHandler<React.MouseEvent>
  ) => React.EventHandler<React.MouseEvent>;
}

/**
 * Dropdown for each entry in the stash
 */
const GitStashEntry: React.FunctionComponent<IGitStashEntryProps> = (
  props: IGitStashEntryProps
) => {
  const [showStashFiles, setShowStashFiles] = React.useState(false);

  const nFiles = props?.files?.length;

  return (
    <div className={sectionFileContainerStyle}>
      <div
        className={sectionAreaStyle}
        onClick={() => {
          if (props.collapsible && props?.files.length > 0) {
            setShowStashFiles(!showStashFiles);
          }
        }}
      >
        {props.collapsible && (
          <button className={changeStageButtonStyle}>
            {showStashFiles && props?.files.length > 0 ? (
              <caretDownIcon.react />
            ) : (
              <caretRightIcon.react />
            )}
          </button>
        )}
        <span className={sectionHeaderLabelStyle}>
          <p>{props.trans.__('%1 (on %2)', props.message, props.branch)}</p>
          <span className={sectionButtonContainerStyle}>{props.actions}</span>
        </span>
      </div>
      {showStashFiles && (
        <FixedSizeList
          className={listStyle}
          height={Math.max(
            Math.min(props.height - HEADER_HEIGHT, nFiles * ITEM_HEIGHT),
            ITEM_HEIGHT
          )}
          itemCount={nFiles}
          innerElementType="ul"
          itemData={props?.files}
          itemKey={(index, data) => data[index]}
          itemSize={ITEM_HEIGHT}
          width={'auto'}
          style={{ margin: 0, paddingLeft: 0 }}
        >
          {({ index }) => {
            const file = props.files[index];
            return (
              <li className={stashFileStyle}>
                <FilePath filepath={file} filetype={null} />
              </li>
            );
          }}
        </FixedSizeList>
      )}
    </div>
  );
};

export const GitStash: React.FunctionComponent<IGitStashProps> = (
  props: IGitStashProps
) => {
  const [showStash, setShowStash] = React.useState(false);

  const nStash = props && props.stash ? props.stash.length : 0;

  const gitStashPop = async (index: number): Promise<void> => {
    try {
      await props.model.stash_pop(index);
    } catch (err) {
      console.error(err);
    }
  };

  const gitStashDrop = async (index: number): Promise<void> => {
    try {
      await props.model.stash_drop(index);
    } catch (err) {
      console.error(err);
    }
  };

  const gitStashApply = async (index: number): Promise<void> => {
    try {
      await props.model.stash_apply(index);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={sectionFileContainerStyle}>
      <div
        className={sectionAreaStyle}
        onClick={() => {
          if (props.collapsible && nStash > 0) {
            setShowStash(!showStash);
          }
        }}
      >
        {props.selectAllButton && props.selectAllButton}
        {props.collapsible && (
          <button className={changeStageButtonStyle}>
            {showStash && nStash > 0 ? (
              <caretDownIcon.react />
            ) : (
              <caretRightIcon.react />
            )}
          </button>
        )}
        <span className={sectionHeaderLabelStyle}>
          <p>{props.trans.__('Stash')}</p>
          <span className={sectionButtonContainerStyle}>
            {props.actions}
            <span>({nStash})</span>
          </span>
        </span>
      </div>

      <UseSignal signal={props.model.stashChanged}>
        {() => {
          if (!props.stash || !Array.isArray(props.stash)) {
            return null;
          }

          const nStash = props.stash.length;

          return (
            props.model.stashChanged &&
            showStash &&
            nStash > 0 && (
              <>
                {props.stash.map(entry => (
                  <GitStashEntry
                    key={entry.index}
                    files={entry.files}
                    model={props.model}
                    index={entry.index}
                    branch={entry.branch}
                    trans={props.trans}
                    message={entry.message}
                    height={100}
                    collapsible={true}
                    stopPropagationWrapper={props.stopPropagationWrapper}
                    actions={
                      <React.Fragment>
                        <ActionButton
                          className={hiddenButtonStyle}
                          icon={addIcon}
                          title={props.trans.__('Pop stash entry')}
                          onClick={props.stopPropagationWrapper(() => {
                            gitStashPop(entry.index);
                          })}
                        />
                        <ActionButton
                          className={hiddenButtonStyle}
                          icon={discardIcon}
                          title={props.trans.__('Drop stash entry')}
                          onClick={props.stopPropagationWrapper(() => {
                            gitStashDrop(entry.index);
                          })}
                        />
                        <ActionButton
                          className={hiddenButtonStyle}
                          icon={removeIcon}
                          title={props.trans.__('Apply stash entry')}
                          onClick={props.stopPropagationWrapper(() => {
                            gitStashApply(entry.index);
                          })}
                        />
                      </React.Fragment>
                    }
                  />
                ))}
              </>
            )
          );
        }}
      </UseSignal>
    </div>
  );
};
