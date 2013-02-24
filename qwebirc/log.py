def NullLogger():
  def logger(*args, **kwargs):
    pass

  return logger
