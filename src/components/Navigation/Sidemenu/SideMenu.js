import React from "react";
import NavigationItems from "../NavigationItems/NavigationItems";
import classes from "./SideMenu.module.scss";
import Backdrop from "../../UI/Backdrop/Backdrop";
import Utils from "../../../Utils";
import Button from "../../UI/Button/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const sideMenu = props => {
  let classList = Utils.getClassNameString([
    classes.SideMenuBack,
    classes.Close
  ]);
  if (props.open) {
    classList = Utils.getClassNameString([classes.SideMenuBack, classes.Open]);
  }

  return (
    <div className={classes.SideMenu}>
      <Backdrop
        className={classes.Backdrop}
        show={props.open}
        clicked={props.closed}
      />
      <div className={classList}>
        <div className={classes.SideMenuHeader}>
          <h2>Menu</h2>
          <Button className="CloseBtn" clicked={props.closed}>
            <FontAwesomeIcon icon={["fas", "times"]} />
          </Button>
        </div>

        <nav>
          <NavigationItems />
        </nav>
      </div>
    </div>
  );
};

export default sideMenu;