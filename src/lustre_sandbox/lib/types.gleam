import gleam/dict.{type Dict}
import lustre/ui.{type Theme}
import lustre_sandbox/lib/msg.{type Route}

pub type Model {
  Model(
    state: State,
  )
}

pub type State {
  State(
    route: Route,
    theme: Theme,
    images: List(ImageRef),
    inputs: Dict(String, String),
    ints: Dict(String, Int),
    carousels: Dict(String, CarouselState),
  )
}

pub type ImageRef {
  ImageRef(title: String, location: String)
}

pub type CarouselState
