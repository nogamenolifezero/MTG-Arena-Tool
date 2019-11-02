import db from "./database";
import pd from "./player-data";
import { cardHasType } from "./card-types.js";
import { createDiv, queryElements as $$ } from "./dom-fns";
import { getCardImage } from "./util";
import { DRAFT_RANKS, FACE_DFC_BACK, FACE_DFC_FRONT } from "./constants.js";

// controls when to auto-hide hover display
// workaround for edge case bugs that cause hover to "get stuck"
const MAX_HOVER_TIME = 10000; // 10 seconds

let renderer = 0;

export const setRenderer = value => {
  renderer = value;
};

let lastHoverStart = null;

export function addCardHover(element, card, odds) {
  if (!card || !card.images) return;

  // This is hackish.. the way we insert our custom elements in the
  // array of cards is wrong in the first place :()
  const isCardGroupedLands = card && card.id === 100 && odds;
  let landsDiv;
  if (isCardGroupedLands) {
    landsDiv = createDiv(["lands_div"]);

    const createManaChanceDiv = function(odds, color) {
      const cont = createDiv(["mana_cont"], odds + "%");
      const div = createDiv(["mana_s16", "flex_end", "mana_" + color]);
      cont.appendChild(div);
      landsDiv.appendChild(cont);
    };

    if (odds.landW) createManaChanceDiv(odds.landW, "w");
    if (odds.landU) createManaChanceDiv(odds.landU, "u");
    if (odds.landB) createManaChanceDiv(odds.landB, "b");
    if (odds.landR) createManaChanceDiv(odds.landR, "r");
    if (odds.landG) createManaChanceDiv(odds.landG, "g");
  }

  const hideHover = () => {
    $$(
      ".hover_card_quantity, .main_hover, .main_hover_ratings, .main_hover_dfc, .loader, .loader_dfc"
    ).forEach(element => (element.style.opacity = 0));
    $$(".lands_div").forEach(div => {
      if (div) {
        $$(".overlay_hover_container")[0].removeChild(div);
      }
    });
    lastHoverStart = null;
  };

  element.addEventListener("mouseover", () => {
    $$(".loader, .main_hover").forEach(element => (element.style.opacity = 1));

    if (isCardGroupedLands && landsDiv) {
      $$(
        ".hover_card_quantity, .main_hover, .main_hover_ratings, .main_hover_dfc, .loader, .loader_dfc"
      ).forEach(element => (element.style.opacity = 0));
      $$(".overlay_hover_container")[0].appendChild(landsDiv);
    } else {
      // Split cards are readable both halves, no problem
      if (
        (card.dfc == FACE_DFC_BACK || card.dfc == FACE_DFC_FRONT) &&
        renderer == 0
      ) {
        $$(".loader_dfc, .main_hover_dfc").forEach(el => {
          show(el);
          el.style.opacity = 1;
        });

        var dfcCard = db.card(card.dfcId);
        var dfcCardImage = getCardImage(dfcCard);

        var dfcImageElement = $$(".main_hover_dfc")[0];
        dfcImageElement.src = dfcCardImage;
        dfcImageElement.addEventListener("load", () => {
          $$(".loader_dfc").forEach(el => (el.style.opacity = 0));
        });
      } else {
        $$(".main_hover_dfc, .loader_dfc").forEach(hide);
      }

      var mainImageElement = $$(".main_hover")[0];
      mainImageElement.src = getCardImage(card);
      mainImageElement.addEventListener("load", () => {
        $$(".loader").forEach(el => (el.style.opacity = 0));
      });

      // show card quantity
      if (renderer == 0) {
        attachOwnerhipStars(card, $$(".hover_card_quantity")[0]);
      }

      if (renderer == 2) {
        attachDraftRatings(card, $$(".main_hover_ratings")[0]);
      } else {
        $$(".main_hover_ratings").forEach(
          element => (element.style.display = "none")
        );
      }
    }

    lastHoverStart = Date.now();

    setTimeout(() => {
      if (lastHoverStart && Date.now() - lastHoverStart > MAX_HOVER_TIME) {
        hideHover();
      }
    }, MAX_HOVER_TIME + 1);
  });

  element.addEventListener("mouseleave", hideHover);
}

function show(element, mode) {
  if (!mode) {
    mode = "block";
  }
  element.style.display = mode;
  return element;
}

function hide(element) {
  element.style.display = "none";
  return element;
}

export function attachOwnerhipStars(card, starContainer) {
  let isbasic = cardHasType(card, "Basic Land");
  starContainer.innerHTML = "";
  starContainer.style.opacity = 1;

  const owned = pd.cards.cards[card.id];
  const acquired = pd.cardsNew[card.id];

  if (isbasic) {
    // Show infinity for basics (should work for rats and petitioners?)
    if (owned > 0) starContainer.title = `∞ copies in collection`;
    else starContainer.title = `0 copies in collection`;
    if (acquired) {
      starContainer.title += ` (∞ recent)`;
    }

    let color = "gray";
    if (owned > 0) color = "green";
    if (acquired > 0) color = "orange";

    starContainer.appendChild(createDiv([`inventory_card_infinity_${color}`]));
  } else {
    starContainer.title = `${owned || 0}/4 copies in collection`;
    if (acquired) {
      starContainer.title += ` (${acquired} recent)`;
    }

    for (let i = 0; i < 4; i++) {
      let color = "gray";

      if (i < owned) color = "green";
      if (acquired && i >= owned - acquired && i < owned) color = "orange";

      starContainer.appendChild(
        createDiv([`inventory_card_quantity_${color}`])
      );
    }
  }
}

export function attachDraftRatings(card, ratingsContainer) {
  ratingsContainer.innerHTML = "";
  ratingsContainer.style.opacity = 1;
  ratingsContainer.style.display = "flex";

  let rank = card.rank;
  let rankValues = card.rank_values;
  let rankControversy = card.rank_controversy;
  let maxValue = Math.max(...rankValues);
  let valuesContainer = createDiv([`rank_values_main_container`]);

  let rankCont = createDiv(
    [`rank_value_container`],
    `Rank: ${DRAFT_RANKS[Math.round(rank)]}`
  );
  valuesContainer.appendChild(rankCont);
  let controversyCont = createDiv(
    [`rank_value_container`],
    `Controversy: ${rankControversy}`
  );
  valuesContainer.appendChild(controversyCont);

  rankValues.forEach((v, index) => {
    let rv = 12 - index;
    let rank = DRAFT_RANKS[rv];

    let colorClass = "white";
    if (rank == "A+" || rank == "A") colorClass = "blue";
    if (rank == "A-" || rank == "B+" || rank == "B") colorClass = "green";
    if (rank == "C-" || rank == "D+" || rank == "D") colorClass = "orange";
    if (rank == "D-" || rank == "F") colorClass = "red";

    let divCont = createDiv([`rank_value_container`]);
    let divTitle = createDiv([`rank_value_title`, colorClass], rank);
    let divBar = createDiv([`rank_value_bar`]);
    divBar.style.width = (240 / maxValue) * v + "px";

    divCont.appendChild(divTitle);
    divCont.appendChild(divBar);
    valuesContainer.appendChild(divCont);
  });

  ratingsContainer.appendChild(valuesContainer);
}
