export interface CreateRadio {
  name: string
  streamUrl: string
  homePageUrl: string
}

export interface Radio extends CreateRadio {
  id: string
}
export interface RadioStation {
  internetRadioStation: Radio[]
}
