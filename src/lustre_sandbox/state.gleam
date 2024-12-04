import gleam/dict.{type Dict}
import lustre/ui.{type Theme, Theme}

import lustre_sandbox/route.{type Route}

pub type State {
  State(
    route: Route,
    theme: Theme,
    inputs: Dict(String, String),
    ints: Dict(String, Int),
    carousels: Dict(String, CarouselState),
  )
}

pub type CarouselState
